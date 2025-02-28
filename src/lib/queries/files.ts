import { useMutation, useQuery } from '@tanstack/react-query';
import queryClient from './client';

export type UserFilesResponse = {
  createdAt: Date;
  expiresAt?: Date;
  name: string;
  mimetype: string;
  id: string;
  favorite: boolean;
  url: string;
  size: number;
  maxViews: number;
  views: number;
  folderId?: number;
};

export const useFiles = (query: { [key: string]: string } = {}) => {
  const queryBuilder = new URLSearchParams(query);
  const queryString = queryBuilder.toString();

  return useQuery<UserFilesResponse[]>(['files', queryString], async () => {
    return fetch('/api/user/files?' + queryString)
      .then((res) => res.json() as Promise<UserFilesResponse[]>)
      .then((data) =>
        query.paged === 'true'
          ? data
          : data.map((x) => ({
              ...x,
              createdAt: new Date(x.createdAt),
              expiresAt: x.expiresAt ? new Date(x.expiresAt) : null,
            }))
      );
  });
};

export type PaginatedFilesOptions = {
  filter: 'media' | 'none';
  favorite: boolean;
  sortBy: 'createdAt' | 'views' | 'expiresAt' | 'size' | 'name' | 'mimetype';
  order: 'asc' | 'desc';
};

export const usePaginatedFiles = (page?: number, options?: Partial<PaginatedFilesOptions>) => {
  const queryString = new URLSearchParams({
    page: Number(page || '1').toString(),
    filter: options?.filter ?? 'none',
    // ...(options?.favorite !== null && { favorite: options?.favorite?.toString() }),
    favorite: options.favorite ? 'true' : '',
    sortBy: options.sortBy ?? '',
    order: options.order ?? '',
  }).toString();

  return useQuery<UserFilesResponse[]>(['files', queryString], async () => {
    return fetch('/api/user/paged?' + queryString)
      .then((res) => res.json() as Promise<UserFilesResponse[]>)
      .then((data) =>
        data.map((x) => ({
          ...x,
          createdAt: new Date(x.createdAt),
          expiresAt: x.expiresAt ? new Date(x.expiresAt) : null,
        }))
      );
  });
};

export const useRecent = (filter?: string) => {
  return useQuery<UserFilesResponse[]>(['recent', filter], async () => {
    return fetch(`/api/user/recent?filter=${encodeURIComponent(filter)}`)
      .then((res) => res.json())
      .then((data) =>
        data.map((x) => ({
          ...x,
          createdAt: new Date(x.createdAt),
          expiresAt: x.expiresAt ? new Date(x.expiresAt) : null,
        }))
      );
  });
};

export function useFileDelete() {
  // '/api/user/files', 'DELETE', { id: image.id }
  return useMutation(
    async (id: string) => {
      return fetch('/api/user/files', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json());
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(['files']);
      },
    }
  );
}

export function useFileFavorite() {
  // /api/user/files', 'PATCH', { id: image.id, favorite: !image.favorite }
  return useMutation(
    async (data: { id: string; favorite: boolean }) => {
      return fetch('/api/user/files', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json());
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(['files']);
      },
    }
  );
}

export function invalidateFiles() {
  return queryClient.invalidateQueries(['files', 'recent', 'stats']);
}
