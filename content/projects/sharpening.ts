import type { Project } from "../types";

export const sharpening: Project = {
  slug: "image-sharpening-studio",
  name: "Image Sharpening Studio",
  code: "IVP",
  position: 8,
  timing: "yellow",
  towerStat: "24.95 dB best",
  tagline: "A benchmark of spatial and frequency domain sharpening, with an interactive studio for tuning it.",
  date: "Oct 2026",
  team: "Team project · Coursework",
  stats: [
    { value: "9", label: "Methods benchmarked" },
    { value: "150", label: "Benchmark runs" },
    { value: "6", label: "Evaluation metrics" },
    { value: "MATLAB", label: "Processing engine" },
  ],
  problem:
    "Blur, defocus and sensor noise weaken edges, and sharpening methods trade detail against amplified noise in different ways.",
  build: [
    "Implemented Laplacian, unsharp masking, high-boost, gradient and frequency domain filters.",
    "Benchmarked each on 5 images at 3 blur levels, against the unsharpened blur as a baseline.",
    "Compared them with PSNR, SSIM and MSE, plus no-reference sharpness measures.",
    "A Streamlit interface calls the MATLAB functions for live tuning.",
  ],
  comparison: {
    before: "/projects/sharpen-before.webp",
    after: "/projects/sharpen-after.webp",
    beforeLabel: "Blurred",
    afterLabel: "Laplacian",
    alt: "Synthetic colour test image",
    caption:
      "Drag to compare. The sharpened side is the 4-neighbour Laplacian, recreated in Python for this page. The recreation matches the project's benchmark on cameraman at sigma 1, at 32.704 dB.",
    width: 720,
    height: 720,
  },
  charts: [
    {
      title: "Average PSNR by method",
      note: "Higher is better. Average of 15 runs per method, across 5 images at 3 blur levels.",
      max: 30,
      rows: [
        { label: "Laplacian, 4-neighbour", value: 24.95, display: "24.95 dB" },
        { label: "High-boost", value: 24.6, display: "24.60 dB" },
        { label: "Unsharp masking", value: 24.35, display: "24.35 dB" },
        { label: "Laplacian, 8-neighbour", value: 24.29, display: "24.29 dB" },
        { label: "Gaussian HPF", value: 24, display: "24.00 dB" },
        { label: "Butterworth HPF", value: 23.96, display: "23.96 dB" },
        { label: "Ideal HPF", value: 23.59, display: "23.59 dB" },
        { label: "Blurred baseline", value: 23.17, display: "23.17 dB" },
        { label: "Prewitt gradient", value: 15.32, display: "15.32 dB" },
        { label: "Sobel gradient", value: 14.48, display: "14.48 dB" },
      ],
    },
  ],
  incidents: [],
  notes: [
    "Sobel and Prewitt gradient sharpening scored well below the blurred baseline on PSNR at these settings. Every other method beat it.",
    "PSNR rewards closeness to the original image, so it's one view of sharpening and not a verdict on how an image looks.",
  ],
  stack: ["MATLAB", "Python", "Streamlit"],
  links: [{ label: "Source", href: "https://github.com/Parth-3107/IVP-Image-sharpening-Toolkit-" }],
};
