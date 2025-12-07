import posthog from "posthog-js";

// Initialize PostHog
export const initPostHog = () => {
  try {
    posthog.init("phc_Iy9MoSuNRAOinmUwdfJYlrsOkLkybqJSnTMaIItXHlz", {
      api_host: "https://eu.i.posthog.com",
      // Enable session recording if needed
      // session_recording: {
      //   recordCrossOriginIframes: true,
      // },
    });
    
    // Set global property to identify this project
    posthog.register({
      project: "lunii-admin",
    });
  } catch (error) {
    console.error("Failed to initialize PostHog:", error);
  }
};

export default posthog;
