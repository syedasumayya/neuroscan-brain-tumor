export type Province = "Khyber Pakhtunkhwa" | "Islamabad" | "Punjab" | "Sindh";
export type Sector = "Public" | "Private" | "Non-profit";

/** What each hospital's own pages say it offers. Only claim what was confirmed. */
export type Capability = "brain-tumor-surgery" | "pituitary-surgery" | "neurosurgery" | "cancer-treatment";

export type Hospital = {
  id: string;
  name: string;
  city: string;
  province: Province;
  sector: Sector;
  capabilities: Capability[];
  summary: string;
  website: string;
  websiteLabel: string;
};

/**
 * A starting list, not a directory and not a ranking. Each entry was checked against the
 * hospital's own website (or an official government page) when this list was written.
 * Phone numbers and doctors' names are left out on purpose: they change, so each entry
 * links to the hospital's own page instead. Extend this list yourself, but only with
 * facts you have checked on the hospital's official site.
 */
export const HOSPITALS: Hospital[] = [
  {
    id: "lrh-peshawar",
    name: "Lady Reading Hospital (LRH)",
    city: "Peshawar",
    province: "Khyber Pakhtunkhwa",
    sector: "Public",
    capabilities: ["brain-tumor-surgery", "pituitary-surgery", "neurosurgery"],
    summary:
      "Public tertiary teaching hospital. Its neurosurgery department lists primary brain tumor surgery, pituitary disorders, skull-base surgery and radiosurgery.",
    website: "https://www.lrh.edu.pk/neurosurgery.html",
    websiteLabel: "Neurosurgery department",
  },
  {
    id: "rmi-peshawar",
    name: "Rehman Medical Institute (RMI)",
    city: "Peshawar",
    province: "Khyber Pakhtunkhwa",
    sector: "Private",
    capabilities: ["brain-tumor-surgery", "pituitary-surgery", "neurosurgery"],
    summary:
      "Private tertiary hospital. Its neurosurgery department lists brain tumor surgery and endoscopic and transsphenoidal surgery (the usual route to reach pituitary tumors).",
    website: "https://rmi.edu.pk/specialties/neurosurgery/",
    websiteLabel: "Neurosurgery department",
  },
  {
    id: "skmch-peshawar",
    name: "Shaukat Khanum Memorial Cancer Hospital",
    city: "Peshawar",
    province: "Khyber Pakhtunkhwa",
    sector: "Non-profit",
    capabilities: ["cancer-treatment"],
    summary:
      "Cancer hospital with surgical, clinical and radiation oncology departments. Most relevant once a specialist confirms a tumor is cancerous.",
    website: "https://www.shaukatkhanum.org.pk/",
    websiteLabel: "Hospital website",
  },
  {
    id: "pims-islamabad",
    name: "Pakistan Institute of Medical Sciences (PIMS)",
    city: "Islamabad",
    province: "Islamabad",
    sector: "Public",
    capabilities: ["brain-tumor-surgery", "neurosurgery"],
    summary:
      "Public teaching hospital with a neurosurgery department. Its neurosurgical unit has published series of brain tumor cases.",
    website: "https://pims.gov.pk",
    websiteLabel: "Hospital website",
  },
  {
    id: "pins-lahore",
    name: "Punjab Institute of Neurosciences (PINS)",
    city: "Lahore",
    province: "Punjab",
    sector: "Public",
    capabilities: ["brain-tumor-surgery", "neurosurgery"],
    summary:
      "500-bed public neurosciences institute at Lahore General Hospital. Its own reports list brain tumor care among its neurosurgical services.",
    website: "https://health.punjab.gov.pk/Achievement5.aspx",
    websiteLabel: "Punjab Health Department page",
  },
  {
    id: "mayo-lahore",
    name: "Mayo Hospital",
    city: "Lahore",
    province: "Punjab",
    sector: "Public",
    capabilities: ["neurosurgery"],
    summary: "Public teaching hospital whose neurosurgery department is part of King Edward Medical University.",
    website: "http://www.mayohospital.gop.pk/neurosurgery.php",
    websiteLabel: "Neurosurgery department",
  },
  {
    id: "skmch-lahore",
    name: "Shaukat Khanum Memorial Cancer Hospital",
    city: "Lahore",
    province: "Punjab",
    sector: "Non-profit",
    capabilities: ["cancer-treatment"],
    summary:
      "Cancer hospital with surgical, clinical and radiation oncology departments. Most relevant once a specialist confirms a tumor is cancerous.",
    website: "https://www.shaukatkhanum.org.pk/",
    websiteLabel: "Hospital website",
  },
  {
    id: "aku-karachi",
    name: "Aga Khan University Hospital",
    city: "Karachi",
    province: "Sindh",
    sector: "Private",
    capabilities: ["brain-tumor-surgery", "neurosurgery"],
    summary:
      "Private university hospital with a Section of Neurosurgery. It has published its experience with awake craniotomy for brain tumors.",
    website: "https://www.aku.edu/mcpk/surgery/Pages/neurosurgery.aspx",
    websiteLabel: "Neurosurgery section",
  },
  {
    id: "chk-karachi",
    name: "Civil Hospital Karachi",
    city: "Karachi",
    province: "Sindh",
    sector: "Public",
    capabilities: ["neurosurgery"],
    summary: "Large public teaching hospital whose surgery department includes neurosurgery.",
    website: "https://chk.gov.pk",
    websiteLabel: "Hospital website",
  },
];