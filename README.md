# 🚀 LinkedIn Automation (Raspberry Pi / Node.js)

This project automates **weekly LinkedIn posts** (with text + images) using the LinkedIn API.  
It’s designed to run on a Raspberry Pi (or any Linux server) and post automatically on a schedule.

---

## 📂 Project Structure

linkedin_automate/
├─ src/
│ ├─ linkedin-post.js # Main automation script
│ └─ config.js # LinkedIn API credentials
├─ images/
│ ├─ week1/
│ │ ├─ content.txt # Post text for week1
│ │ ├─ 1.jpg # Image(s) for week1
│ │ └─ 2.png
│ ├─ week2/
│ │ ├─ content.txt
│ │ ├─ 1.jpg
│ │ └─ 2.jpg
└─ posted.json # Tracks already-posted weeks (auto-created)


- **`content.txt`** → text of your post (hashtags, description, etc).  
- **Images** → any `.jpg` / `.png` in the same folder will be uploaded along with the post.  
- **posted.json** → log file to ensure the same week isn’t posted twice.

---

## ⚙️ Configuration

Edit `src/config.js`:

```js
export const LINKEDIN = {
  accessToken: "YOUR_ACCESS_TOKEN",
  userUrn: "urn:li:person:XXXXXXXXXXXX",
};


## **Start**
>> npm i
>> npm start
