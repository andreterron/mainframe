import github from "./github.png";
import toggl from "./toggl.png";
import posthog from "./posthog.png";
import peloton from "./peloton.png";
import gcal from "./google_calendar.png";
import zotero from "./zotero.png";
import notion from "./notion.png";
import oura from "./oura.png";

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
    case "google":
      return gcal;
    case "zotero":
      return zotero;
    case "notion":
      return notion;
    case "oura":
      return oura;
  }
}
