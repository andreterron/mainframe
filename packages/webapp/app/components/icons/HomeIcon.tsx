import { ComponentProps } from "react";
import { cn } from "../../lib/utils";

export function HomeIcon({ className, ...props }: ComponentProps<"svg">) {
  return (
    <div>
      {/* <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        {...props}
        className={cn("humbleicons hi-home", className)}
      >
        <path
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9M6 10l6-6 6 6M6 10l-2 2m14-2l2 2"
        />
      </svg> */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
        className={cn("humbleicons hi-home", className)}
      >
        <rect
          width="18"
          height="18"
          rx="9"
          fill="url(#paint0_linear_125_498)"
        />
        <g filter="url(#filter0_d_125_498)">
          <path
            d="M13.6333 11.8914C13.4276 11.6057 13.4162 11.2286 13.4162 10.4286V7.57143C13.4162 6.78286 13.4276 6.40571 13.6333 6.10857C13.9304 5.69714 14.0104 5.56 13.999 5.35429C13.9761 5.11429 13.8161 5 13.4734 5H11.8623C11.2452 5 11.0967 5.19429 10.8796 5.70857C10.5711 6.41714 8.98286 10.1771 8.98286 10.1771C8.98286 10.1771 7.56601 6.31429 7.32606 5.66286C7.12039 5.12571 6.80046 5 6.32056 5H4.53807C4.18386 5 4.02389 5.11429 4.00104 5.35429C3.98962 5.56 4.0696 5.69714 4.36668 6.10857C4.57235 6.40571 4.5952 6.78286 4.5952 7.57143V10.4286C4.5952 11.2286 4.57235 11.6057 4.36668 11.8914C4.0696 12.3029 3.98962 12.4514 4.00104 12.6571C4.02389 12.8971 4.18386 13 4.53807 13H5.73782C6.09204 13 6.252 12.8971 6.27485 12.6571C6.28628 12.4514 6.19487 12.3029 5.89779 11.8914C5.69212 11.6057 5.66927 11.2286 5.66927 10.4286V7.50286C6.42339 9.35429 7.29179 11.5943 7.41747 11.9257C7.63457 12.4971 7.88595 13 8.41155 13C9.06284 13 9.18853 12.52 9.51989 11.72C9.70271 11.2743 10.5597 9.20571 11.2452 7.56V10.4286C11.2452 11.2286 11.2338 11.6057 11.0281 11.8914C10.7311 12.3029 10.6511 12.4514 10.6625 12.6571C10.6854 12.8971 10.8453 13 11.1881 13H13.4734C13.8161 13 13.9761 12.8971 13.999 12.6571C14.0104 12.4514 13.9304 12.3029 13.6333 11.8914Z"
            fill="black"
          />
        </g>
        <defs>
          <filter
            id="filter0_d_125_498"
            x="4"
            y="5"
            width="10.5"
            height="8.5"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="0.5" dy="0.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.819608 0 0 0 0 0.835294 0 0 0 0 0.858824 0 0 0 1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_125_498"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_125_498"
              result="shape"
            />
          </filter>
          <linearGradient
            id="paint0_linear_125_498"
            x1="9"
            y1="18"
            x2="9"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#E0F2FE" />
            <stop offset="1" stop-color="#D1FAE5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
