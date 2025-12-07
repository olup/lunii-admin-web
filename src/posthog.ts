import posthog from "posthog-js";

// Initialize PostHog
export const initPostHog = () => {
  const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Enable session recording if needed
      // session_recording: {
      //   recordCrossOriginIframes: true,
      // },
    });
  }
};

export default posthog;
