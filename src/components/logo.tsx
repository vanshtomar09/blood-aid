import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_303_2)">
      <path
        d="M20.0002 4.16669C12.3335 4.16669 6.66683 9.83335 6.66683 17.5C6.66683 23.225 12.0568 29.9275 18.7502 35C19.3627 35.3742 20.6377 35.3742 21.2502 35C27.9435 29.9275 33.3335 23.225 33.3335 17.5C33.3335 9.83335 27.6668 4.16669 20.0002 4.16669Z"
        className="fill-primary"
      />
      <path
        d="M23.3332 17.5C23.3332 19.3408 21.8406 20.8333 19.9998 20.8333C18.159 20.8333 16.6665 19.3408 16.6665 17.5C16.6665 15.6592 19.9998 10.8333 19.9998 10.8333C19.9998 10.8333 23.3332 15.6592 23.3332 17.5Z"
        fill="hsl(var(--primary-foreground))"
      />
    </g>
    <defs>
      <clipPath id="clip0_303_2">
        <rect width="40" height="40" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default Logo;