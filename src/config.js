import { config } from "dotenv";
config(); 

export const LINKEDIN = {
  accessToken:  process.env["LINKEDIN_ACCESS_TOKEN"], // wanted
  clientID:  process.env["LINKEDIN_CLIENT_ID"], // optional 
  clientSecret:  process.env["LINKEDIN_CLIENT_SECRET"], // optional 
  userUrn: process.env["LINKEDIN_URN"] // wanted
};
