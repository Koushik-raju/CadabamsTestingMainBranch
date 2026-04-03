'use client';

import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export function useWellnessResources(category?: string) {
  const base = 'https://admin.mindtalkbuddy.com/api/blogs';
  const url = category ? `${base}?category=${category}` : base;
  return useSWR(url, fetcher);
}
