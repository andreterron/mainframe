import github from "./github.png";
import toggl from "./toggl.png";
import posthog from "./posthog.png";
import peloton from "./peloton.png";

export function datasetIcon(id: string) {
    switch (id) {
        case "github":
            return github;
        case "toggl":
            return toggl;
        case "posthog":
            return posthog;
        case "peloton":
            return peloton;
    }
}
