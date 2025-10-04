import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import axios from "axios";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { LINKEDIN } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_FILE = path.join(__dirname, "../posted.json");

// === Utility: load & save log ===
function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// === STEP 1: Register upload for an image ===
async function registerUpload() {
  const res = await axios.post(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: LINKEDIN.userUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${LINKEDIN.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 15000,
    }
  );
  return res.data.value;
}

// === STEP 2: Upload image to LinkedIn CDN ===
async function uploadImage(uploadUrl, imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const contentType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      Authorization: `Bearer ${LINKEDIN.accessToken}`,
      "Content-Type": contentType,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 20000,
  });
}

// === STEP 3: Post with text + images ===
async function postToLinkedIn(content, imageUrns = []) {
  const res = await axios.post(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      author: LINKEDIN.userUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: imageUrns.length > 0 ? "IMAGE" : "NONE",
          media: imageUrns.map(urn => ({
            status: "READY",
            description: { text: "Auto uploaded image" },
            media: urn,
            title: { text: "Raspberry Pi Automation" },
          })),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    },
    {
      headers: {
        Authorization: `Bearer ${LINKEDIN.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 15000,
    }
  );

  console.log("✅ Post successful:", res.data);
  return res.data;
}

// === STEP 4: Load content + images from weekly folder ===
async function postFromWeek(weekNumber) {
  const log = loadLog();
  if (log.find(entry => entry.week === weekNumber)) {
    console.log(`⚠️ Week ${weekNumber} already posted. Skipping...`);
    return;
  }

  const weekPath = path.join(__dirname, "../images", `week${weekNumber}`);
  const contentPath = path.join(weekPath, "content.txt");

  if (!fs.existsSync(contentPath)) {
    throw new Error(`❌ Missing content.txt at: ${contentPath}`);
  }

  const content = fs.readFileSync(contentPath, "utf-8").trim();
  console.log("📄 Loaded content:", content);

  const imageFiles = fs.readdirSync(weekPath).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  console.log("🖼 Found images:", imageFiles);

  let imageUrns = [];
  for (const file of imageFiles) {
    const { uploadMechanism, asset } = await registerUpload();
    const uploadUrl =
      uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    await uploadImage(uploadUrl, path.join(weekPath, file));
    imageUrns.push(asset);
  }

  const result = await postToLinkedIn(content, imageUrns);

  // log the post
  log.push({
    week: weekNumber,
    time: new Date().toISOString(),
    postId: result.id || null,
  });
  saveLog(log);

  console.log(`📝 Logged week ${weekNumber} as posted.`);
}

// === CRON SCHEDULER ===
// Runs every Monday at 1 AM
cron.schedule("0 1 * * 1", async () => {
  const weekNumber = new Date().getWeekNumber?.() || Math.ceil(new Date().getDate() / 7);
  console.log(`📅 Auto-posting for week ${weekNumber}...`);
  await postFromWeek(weekNumber);
});

// Helper: ISO week number
Date.prototype.getWeekNumber = function () {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
};

// Immediate test (remove later if only cron needed)
(async () => {
  console.log("🚀 Running test post from week1...");
  await postFromWeek(1);
})();
