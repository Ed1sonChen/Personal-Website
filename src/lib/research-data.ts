/**
 * Research Data Collection Module
 * Aggregates research content from portfolio, blog, and projects
 */

import fs from "fs";
import path from "path";

export interface ResearchDocument {
  id: string;
  title: string;
  content: string;
  source: "project" | "publication" | "blog" | "general";
  metadata: {
    url?: string;
    date?: string;
    tags?: string[];
  };
}

/**
 * Load all blog posts
 */
async function loadBlogPosts(): Promise<ResearchDocument[]> {
  const blogDir = path.join(process.cwd(), "content/blog/en");
  const documents: ResearchDocument[] = [];

  if (!fs.existsSync(blogDir)) {
    return documents;
  }

  const files = fs.readdirSync(blogDir);

  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;

    const filePath = path.join(blogDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Simple extraction of frontmatter and content
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
    const frontmatter = match ? match[1] : "";
    const body = match ? match[2] : content;

    // Extract title from filename
    const title = file.replace(/\.mdx$/, "").replace(/-/g, " ");

    documents.push({
      id: `blog_${file}`,
      title: title,
      content: `${frontmatter}\n\n${body}`,
      source: "blog",
      metadata: {
        tags: ["blog", file.replace(/\.mdx$/, "")],
      },
    });
  }

  return documents;
}

/**
 * Load projects and publications data
 */
async function loadProjectsData(): Promise<ResearchDocument[]> {
  const documents: ResearchDocument[] = [];

  try {
    // Try to load collections data
    const collectionsPath = path.join(
      process.cwd(),
      "src/i18n/messages/en/collections.json"
    );
    if (fs.existsSync(collectionsPath)) {
      const content = fs.readFileSync(collectionsPath, "utf-8");
      const data = JSON.parse(content);

      // Load projects
      if (data.projects?.items) {
        for (const project of data.projects.items) {
          documents.push({
            id: `project_${project.name}`,
            title: project.name,
            content: `Title: ${project.name}\nDates: ${project.dates}\nDescription: ${project.description}\nTechnologies: ${project.technologies?.join(", ") || "N/A"}`,
            source: "project",
            metadata: {
              tags: ["project", ...(project.technologies || [])],
            },
          });
        }
      }

      // Load publications
      if (data.publications?.items) {
        for (const pub of data.publications.items) {
          documents.push({
            id: `publication_${pub.name}`,
            title: pub.name,
            content: `Title: ${pub.name}\nAuthors: ${pub.authors || "N/A"}\nDates: ${pub.dates}\nDescription: ${pub.description}`,
            source: "publication",
            metadata: {
              tags: ["publication", "research"],
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error loading projects data:", error);
  }

  return documents;
}

/**
 * Load general site information
 */
async function loadSiteInfo(): Promise<ResearchDocument[]> {
  const documents: ResearchDocument[] = [];

  try {
    const siteData = await import("@/data/site").then((m) => m.siteConfig);
    const personalData = fs
      .readFileSync(
        path.join(process.cwd(), "src/i18n/messages/en/personal.json"),
        "utf-8"
      )
      .toString();

    documents.push({
      id: "site_info",
      title: "Site Information",
      content: `Website: ${siteData.url}\nLast Updated: ${siteData.lastUpdated}\n\n${personalData}`,
      source: "general",
      metadata: {
        tags: ["general", "about"],
      },
    });
  } catch (error) {
    console.error("Error loading site info:", error);
  }

  return documents;
}

/**
 * Aggregate all research documents
 */
export async function aggregateResearchDocuments(): Promise<
  ResearchDocument[]
> {
  const [blogs, projects, siteInfo] = await Promise.all([
    loadBlogPosts(),
    loadProjectsData(),
    loadSiteInfo(),
  ]);

  return [...blogs, ...projects, ...siteInfo];
}

/**
 * Format documents for LLM context
 */
export function formatDocumentsForContext(
  documents: ResearchDocument[]
): string {
  return documents
    .map(
      (doc) =>
        `[${doc.source.toUpperCase()}] ${doc.title}\n${"-".repeat(50)}\n${doc.content}\n`
    )
    .join("\n");
}
