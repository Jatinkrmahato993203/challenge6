const epa = "https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home";

export const guidance = [
  {
    id: "IA-01", icon: "source", title: "Start with indoor sources", evidence: "Source control",
    summary: "Reduce avoidable smoke, incense and other particle-generating activities where practical.",
    limitations: "Some sources cannot be removed. Ventilation decisions depend on both indoor and outdoor conditions.",
    evidenceUrl: "https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality",
  },
  {
    id: "IA-02", icon: "filter", title: "Choose a properly sized filter", evidence: "Particle filtration",
    summary: "Consider a portable particle air cleaner with a clean air delivery rate suited to the room. Follow its filter maintenance instructions.",
    limitations: "Particle filters do not remove every pollutant, and this app cannot estimate the improvement in a specific room.",
    evidenceUrl: epa,
  },
  {
    id: "IA-03", icon: "window", title: "Ventilate with context", evidence: "Conditional guidance",
    summary: "When outdoor air is cleaner, ventilation can help with some indoor pollutants. Opening windows during high outdoor particle levels can bring particles indoors.",
    limitations: "There is no blanket window-opening rule. Follow applicable local guidance and consider the sources inside your home.",
    evidenceUrl: epa,
  },
  {
    id: "IA-04", icon: "ozone", title: "Avoid ozone-generating cleaners", evidence: "EPA advisory",
    summary: "Avoid cleaners that deliberately generate ozone. Ozone can irritate the lungs.",
    limitations: "Check the product documentation for the technology it uses.",
    evidenceUrl: "https://www.epa.gov/indoor-air-quality-iaq/ozone-generators-are-sold-air-cleaners",
  },
  {
    id: "IA-05", icon: "cost", title: "Prioritize low-cost actions", evidence: "Source control",
    summary: "Start with reducing sources you can control and maintaining the filters you already have.",
    limitations: "Houseplants are not a substitute for effective particle filtration.",
    evidenceUrl: epa,
  },
] as const;

export const transportTip = {
  title: "Combine trips where practical",
  summary: "If errands can share a trip, group them to avoid unnecessary travel. Consider public transit where practical.",
  limitations: "An emissions estimate requires verified distances and compatible factors. Travel exposure is not estimated.",
};
