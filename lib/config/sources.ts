import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

export interface RssSource {
  name: string
  url: string
  intervalMinutes?: number
}

export interface SourcesConfig {
  rss: RssSource[]
  githubTopics: string[]
  githubIntervalMinutes?: number
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'sources.json')

const DEFAULT_CONFIG: SourcesConfig = {
  rss: [
    { name: 'arXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
    { name: 'arXiv ML', url: 'https://rss.arxiv.org/rss/cs.LG' },
    { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog/feed.xml' },
    { name: 'Anthropic News', url: 'https://www.anthropic.com/news.rss' },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  ],
  githubTopics: ['machine-learning', 'llm', 'ai', 'deep-learning'],
}

export function readSourcesConfig(): SourcesConfig {
  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(content) as SourcesConfig
  } catch {
    return DEFAULT_CONFIG
  }
}

export function writeSourcesConfig(config: SourcesConfig): void {
  mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}
