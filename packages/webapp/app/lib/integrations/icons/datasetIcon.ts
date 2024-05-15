import github from "./github.png";
import toggl from "./toggl.png";
import posthog from "./posthog.png";
import peloton from "./peloton.png";
import gcal from "./google_calendar.png";
import zotero from "./zotero.png";
import notion from "./notion.png";
import oura from "./oura.png";
import spotify from "./spotify.png";
import render from "./render.png";
import vercel from "./vercel.png";
import bitbucket from "./bitbucket.png";
import valtown from "./valtown.png";

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
    case "spotify":
      return spotify;
    case "render":
      return render;
    case "vercel":
      return vercel;
    case "bitbucket":
      return bitbucket;
    case "valtown":
      return valtown;
  }
}
