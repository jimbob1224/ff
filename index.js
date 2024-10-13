const puppeteer = require("puppeteer-extra");
const fs = require("fs"); // Import the file system module
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Use the Stealth plugin
puppeteer.use(StealthPlugin());

// Function to generate a random email
const generateRandomEmail = () => {
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${randomString}@example.com`; // Random email format
};

// Function to run the Puppeteer script
const runPuppeteer = async (instanceId) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-gpu"],
  }); // Set headless to true
  const page = await browser.newPage();

  // Navigate to a website
  await page.goto("https://jet2.com");

  // API URLs
  const apiUserUrl = "https://spinforsun.jet2campaigns.com/api/user";
  const apiCodeUrl = "https://spinforsun.jet2campaigns.com/api/code";
  const apiPlayUrl = "https://spinforsun.jet2campaigns.com/api/play";

  // Function to handle the game flow
  const handleGameFlow = async () => {
    try {
      // Generate a random email
      const randomEmail = generateRandomEmail();

      // Generate the code
      const response = await page.evaluate(
        async (url, email) => {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              phone: null,
              sms: false,
            }),
          });
          return res.json(); // Parse the JSON response
        },
        apiUserUrl,
        randomEmail
      );

      const code = response.code; // Store the code from the first response
      console.log("Generated Code:", code); // Log the generated code

      // Redeem the code
      const response2 = await page.evaluate(
        async (url, userCode) => {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: "01JA3K4P9X75DADHQ6E0RFTXSD",
              code: userCode,
            }),
          });
          return res.json(); // Parse the JSON response
        },
        apiCodeUrl,
        code
      );

      console.log("Code Redemption Response:", response2); // Log the redemption response

      // Start the playing process
      const playResponse = await page.evaluate(async (url) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: "01JA3K4P9X75DADHQ6E0RFTXSD", // Use the same user_id
          }),
        });
        return res.json(); // Parse the JSON response
      }, apiPlayUrl);

      // Write the play response to a .txt file
      fs.appendFile(
        "api_responses.txt",
        JSON.stringify(playResponse) + "\n",
        (err) => {
          if (err) {
            console.error(
              `Error writing to file in instance ${instanceId}:`,
              err
            );
          } else {
            console.log(
              `Response written to file in instance ${instanceId}:`,
              playResponse
            );
          }
        }
      );
    } catch (error) {
      console.error(`Error in instance ${instanceId}:`, error);
    } finally {
      // Wait for a while before restarting the flow
      setTimeout(() => {
        handleGameFlow(); // Restart the game flow
      }, 1000); // Adjust the delay as needed (e.g., 1 second)
    }
  };

  // Start the game flow
  handleGameFlow();
};

// Create an array of promises to run the Puppeteer instances
const runMultipleInstances = async (numInstances) => {
  const promises = [];
  for (let i = 0; i < numInstances; i++) {
    promises.push(runPuppeteer(i + 1)); // Pass the instance ID for logging
  }
  await Promise.all(promises); // Wait for all instances to complete
};

// Run 20 instances concurrently
runMultipleInstances(5);
