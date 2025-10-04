import axios from "axios";
import { LINKEDIN } from "./config.js";

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
      timeout: 15000, // 15s safety
    }
  );

  return res.data.value; // contains uploadUrl + asset
}
registerUpload()