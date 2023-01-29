import { Client } from '@notionhq/client'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from 'notion-to-md'
import dayjs from 'dayjs'
import { OUTPUT_DIR } from './config.js'
import fs from 'fs/promises'

const notion = new Client({ auth: '' })
const n2m = new NotionToMarkdown({ notionClient: notion })

const databaseId = '' as string;

async function getAllBlogs() {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      status: {
        equals: 'Published'
      }
    }
  });
  return response;
}

async function getPageMarkdown(pageId: string) {
  const mdBlocks = await n2m.pageToMarkdown(pageId)
  const mdString = n2m.toMarkdownString(mdBlocks)
  return mdString
}

function genHexoPostProperties(properties: PageObjectResponse['properties']) {
  const res = ['---'];
  if (properties.Name.type === 'title') {
    res.push(`title: ${properties.Name.title[0].plain_text}`)
  }
  if (properties.Date.type === 'date') {
    res.push(`date: ${dayjs(properties.Date.date?.start).format('YYYY-MM-DD HH:mm')}`)
  }
  res.push('author: meixuguang');
  res.push('author_link: https://meixg.com');
  if (properties.Categories.type === 'select') {
    res.push(`categories: ${properties.Categories.select?.name}`)
  }
  if (properties.Tags.type === 'multi_select') {
    res.push(`tags: [${properties.Tags.multi_select.map(v => v.name).join(',')}]`)
  }
  res.push('---');

  return res.join('\n')
}

function getPostPath(properties: PageObjectResponse['properties']) {
  if (properties.Path.type === 'select') {
    return properties.Path.select?.name || ''
  }
  return ''
}
function getPostYear(properties: PageObjectResponse['properties']) {
  if (properties.Date.type === 'date') {
    const d = dayjs(properties.Date.date?.start)
    return d.year()
  }
  return ''
}

const startYear = 2015
const thisYear = +dayjs().year()
for (let year = startYear; year <= thisYear; year++) {
  await fs.mkdir(`${OUTPUT_DIR}/${year}`, { recursive: true })
}
const blogs = await getAllBlogs()
console.log(blogs)

for (const blog of blogs.results) {
  const urlPath = getPostPath((blog as PageObjectResponse).properties)
  const postYear = getPostYear((blog as PageObjectResponse).properties)
  if (!urlPath || !postYear) {
    continue
  }

  const properties = genHexoPostProperties((blog as PageObjectResponse).properties)
  const mkStr = await getPageMarkdown(blog.id)
  console.log(properties + '\n' + mkStr)
  await fs.writeFile(`${OUTPUT_DIR}/${postYear}/${urlPath}.md`, properties + '\n' + mkStr)
}


