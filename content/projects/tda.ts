import type { Project } from "../types";

export const tda: Project = {
  slug: "tda-skin-lesions",
  name: "TDA Skin Lesion Study",
  code: "TDA",
  position: 4,
  timing: "green",
  towerStat: "0.697 macro-F1",
  tagline: "Testing whether the shape of a skin lesion, measured with topology, can make a deep learning classifier better.",
  date: "Oct 2026",
  team: "With Pranjal Girase · Coursework research",
  stats: [
    { value: "10,015", label: "Dermoscopy images" },
    { value: "83.4%", label: "CNN test accuracy" },
    { value: "0.697", label: "CNN test macro-F1" },
    { value: "0.030", label: "Most F1 topology lost" },
  ],
  problem:
    "CNNs read dermoscopy images well, but they miss rare lesion types, react badly to hair and lighting, and can't say which lesion property drove a decision. Topological data analysis measures shape directly: lobes, border notches and pigment rings.",
  build: [
    "Built a leakage-free benchmark on HAM10000, split 70/15/15 by lesion over three seeds, with macro-F1 as the headline metric because 67% of images are nevi.",
    "Fine-tuned a ResNet-50 to produce 2,048 texture and colour features for each image.",
    "Used cubical persistent homology on lesion borders and pigment to produce 400 shape features.",
    "Compared CNN-only, topology-only and hybrid features with random forest, SVM and XGBoost classifiers.",
    "Stress-tested each with synthetic hair, noise and brightness changes.",
    "Packaged it with 51 unit tests, three Kaggle notebooks, a web prototype and a paper.",
  ],
  pipeline: {
    title: "Two branches, one feature vector",
    stages: [
      [{ label: "Dermoscopy image", detail: "HAM10000, 7 lesion classes" }],
      [{ label: "Preprocessing", detail: "DullRazor hair removal and a lesion mask" }],
      [
        { label: "CNN branch", detail: "ResNet-50, 2,048 features" },
        { label: "Topology branch", detail: "Cubical persistence, 400 features" },
      ],
      [{ label: "Hybrid vector", detail: "2,448 features together" }],
      [
        { label: "Classifiers", detail: "Seven-class prediction" },
        { label: "Mapper graph", detail: "Finds interpretable lesion groups" },
      ],
    ],
  },
  media: [
    {
      src: "/projects/tda-mapper.webp",
      alt: "Mapper network of lesions coloured from blue for benign to red for malignant, with a red branch labelled flare 1",
      caption:
        "Mapper graph of the hybrid features. Flare 1 isolates a malignant group of 271 lesions with fewer pigment rings and more fragmented borders than the rest.",
      width: 1064,
      height: 882,
    },
  ],
  charts: [
    {
      title: "Test macro-F1 by feature set",
      note: "Higher is better. Random forest, mean of 3 seeds. Random guessing scores 0.115, and bootstrap tests found no consistent difference between CNN and hybrid.",
      max: 1,
      rows: [
        { label: "CNN only", value: 0.694, display: "0.694" },
        { label: "Hybrid", value: 0.694, display: "0.694" },
        { label: "Topology only", value: 0.246, display: "0.246" },
      ],
    },
    {
      title: "Macro-F1 lost to strong noise",
      note: "Lower is better. XGBoost, noise sigma 0.15. Topology loses little but also starts low, at about 0.24.",
      max: 1,
      rows: [
        { label: "CNN only", value: 0.434, display: "0.434" },
        { label: "Hybrid", value: 0.434, display: "0.434" },
        { label: "Topology only", value: 0.03, display: "0.030" },
      ],
    },
  ],
  incidents: [
    {
      title: "The hybrid added nothing",
      happened:
        "The main hypothesis failed: hybrid and CNN-only tied at 0.694. CNN features scored 0.93 to 0.98 on training images and 0.69 on unseen ones, so the classifiers trusted them completely and ignored the topology.",
      fix: "Not fixed yet. The next step is training the classifiers on CNN features of images the CNN never saw.",
    },
    {
      title: "Masks that missed the lesion",
      happened:
        "The first segmentation reached a mean Dice of only 0.70 against expert outlines. Dark dermatoscope corners and uneven lighting at the edges were being picked up as lesion.",
      fix: "Rebuilt it on the blue channel, neutralised the corners and scored regions with a centre prior, which raised Dice to 0.796.",
    },
    {
      title: "A z-score in the millions",
      happened:
        "Some persistence-image pixels were zero for nearly every training lesion, so plain standardisation turned one notch in a test lesion into a huge outlier.",
      fix: "Added a variance floor and clipping. Running the whole pipeline on real images is what exposed it.",
    },
  ],
  notes: [
    "Research prototype, not for diagnosis.",
    "Melanoma sensitivity is only 0.43 to 0.44, so 41% to 43% of test melanomas were labelled as moles. That's the weakest result here.",
    "Simple concatenation gave no accuracy or robustness gain. The topology features alone are stable and interpretable, but weak.",
    "Three seeds give a rough spread, and this hasn't been tested on another dataset yet.",
  ],
  stack: ["Python", "PyTorch", "ResNet-50", "GUDHI", "OpenCV", "scikit-learn", "XGBoost", "Kaggle"],
  links: [],
};
