import { useEffect } from 'react';

interface UseSeoParams {
  title: string;
  description?: string;
  canonicalPath?: string;
}

const upsertMeta = (name: string, content: string) => {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export const useSeo = ({ title, description, canonicalPath }: UseSeoParams) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta('description', description);
    }

    if (canonicalPath) {
      const base = window.location.origin;
      upsertCanonical(`${base}${canonicalPath}`);
    }
  }, [title, description, canonicalPath]);
};
