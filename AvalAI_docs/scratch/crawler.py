import os
import re
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup

BASE_URL = "https://docs.avalai.ir"
CACHE_DIR = os.path.join(os.path.dirname(__file__), "docs_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_url(url):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    visited = set()
    to_visit = set(["/en/", "/fa/", "/en/api-reference/introduction", "/fa/api-reference/introduction"])
    
    # First fetch main page to get all sidebar links
    html = fetch_url(BASE_URL + "/en/")
    if html:
        soup = BeautifulSoup(html, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('/') and not href.startswith('//'):
                to_visit.add(href)
            elif href.startswith(BASE_URL):
                path = href[len(BASE_URL):]
                to_visit.add(path)

    # Fetch Persian main page sidebar links as well
    html_fa = fetch_url(BASE_URL + "/fa/")
    if html_fa:
        soup = BeautifulSoup(html_fa, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('/') and not href.startswith('//'):
                to_visit.add(href)
            elif href.startswith(BASE_URL):
                path = href[len(BASE_URL):]
                to_visit.add(path)

    print(f"Total initial links discovered: {len(to_visit)}")

    all_pages = {}

    while to_visit:
        path = to_visit.pop()
        # Clean path fragment
        clean_path = path.split('#')[0].rstrip('/')
        if not clean_path:
            clean_path = '/'
        
        if clean_path in visited:
            continue
        visited.add(clean_path)

        # We are mainly interested in documentation pages, especially API reference & guides
        url = BASE_URL + clean_path
        print(f"Crawling: {url}")
        content = fetch_url(url)
        if content:
            # save cache
            file_name = clean_path.strip('/').replace('/', '_') or 'root'
            cache_file = os.path.join(CACHE_DIR, f"{file_name}.html")
            with open(cache_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            soup = BeautifulSoup(content, 'html.parser')
            all_pages[clean_path] = {
                'title': soup.title.string if soup.title else '',
                'cache_file': cache_file
            }

            # Discover new links on this page
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('/') and not href.startswith('//'):
                    p = href.split('#')[0].rstrip('/')
                    if p and p not in visited and (p.startswith('/en/') or p.startswith('/fa/')):
                        to_visit.add(p)

    with open(os.path.join(CACHE_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(all_pages, f, ensure_ascii=False, indent=2)

    print(f"Crawled {len(visited)} pages successfully.")

if __name__ == '__main__':
    main()
