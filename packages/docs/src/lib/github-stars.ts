import { useEffect, useState } from "react";

// TODO: Update this on the server somehow
const KNOWN_STARS = 79;
let githubStars: number | undefined;

export function useGitHubStars() {
  const [stars, setStars] = useState(githubStars ?? KNOWN_STARS);
  useEffect(() => {
    async function refreshStars() {
      if (typeof window !== "undefined") {
        // TODO: Only refresh this value sporadically
        const res = await fetch(
          "https://api.github.com/repos/andreterron/mainframe",
          {
            headers: {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );
        if (!res.ok) {
          return;
        }
        const body = await res.json();
        const stargazersCount = body?.stargazers_count;
        if (typeof stargazersCount === "number") {
          setStars(stargazersCount);
        }
      }
    }
    if (!githubStars) {
      refreshStars();
    }
    // TODO: Prevent double requests. Either Abort controller, or a simple boolean
  }, []);
  return stars;
}
