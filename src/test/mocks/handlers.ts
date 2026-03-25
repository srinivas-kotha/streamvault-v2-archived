/**
 * MSW v2 request handlers for all StreamVault API endpoints.
 *
 * Uses `http.get()` / `http.post()` / `http.put()` / `http.delete()` (MSW v2 API).
 * Import and override in individual tests via `server.use(...)`.
 */

import { http, HttpResponse } from "msw";
import {
  mockCategory,
  mockLiveStream,
  mockVODStream,
  mockVODInfo,
  mockSeriesItem,
  mockSeriesInfo,
  mockEPGItem,
  mockFavorite,
  mockWatchHistory,
  mockSearchResults,
} from "./fixtures";

const API = "/api";

export const handlers = [
  // ── Auth ─────────────────────────────────────────────────────────────────

  http.post(`${API}/auth/login`, async () => {
    return HttpResponse.json({
      message: "Login successful",
      userId: 1,
      username: "testuser",
    });
  }),

  http.post(`${API}/auth/logout`, async () => {
    return HttpResponse.json({ message: "Logged out" });
  }),

  http.post(`${API}/auth/refresh`, async () => {
    return HttpResponse.json({ message: "Token refreshed" });
  }),

  http.get(`${API}/auth/auto-login`, async () => {
    return HttpResponse.json({ username: "testuser" });
  }),

  // ── Live ─────────────────────────────────────────────────────────────────

  http.get(`${API}/live/featured`, async () => {
    return HttpResponse.json([
      mockLiveStream({ name: "Featured Channel 1" }),
      mockLiveStream({ name: "Featured Channel 2" }),
    ]);
  }),

  http.get(`${API}/live/categories`, async () => {
    return HttpResponse.json([
      mockCategory({ category_id: "1", category_name: "News" }),
      mockCategory({ category_id: "2", category_name: "Sports" }),
      mockCategory({ category_id: "3", category_name: "Entertainment" }),
    ]);
  }),

  http.get(`${API}/live/streams/:categoryId`, async () => {
    return HttpResponse.json([
      mockLiveStream(),
      mockLiveStream(),
      mockLiveStream(),
    ]);
  }),

  http.get(`${API}/live/epg/:streamId`, async () => {
    return HttpResponse.json([mockEPGItem(), mockEPGItem()]);
  }),

  http.post(`${API}/live/epg/bulk`, async () => {
    return HttpResponse.json({});
  }),

  // ── VOD ──────────────────────────────────────────────────────────────────

  http.get(`${API}/vod/categories`, async () => {
    return HttpResponse.json([
      mockCategory({ category_id: "10", category_name: "Action" }),
      mockCategory({ category_id: "11", category_name: "Comedy" }),
      mockCategory({ category_id: "12", category_name: "Drama" }),
    ]);
  }),

  http.get(`${API}/vod/streams/:categoryId`, async () => {
    return HttpResponse.json([
      mockVODStream(),
      mockVODStream(),
      mockVODStream(),
    ]);
  }),

  http.get(`${API}/vod/info/:vodId`, async () => {
    return HttpResponse.json(mockVODInfo());
  }),

  // ── Series ───────────────────────────────────────────────────────────────

  http.get(`${API}/series/categories`, async () => {
    return HttpResponse.json([
      mockCategory({ category_id: "20", category_name: "Telugu Series" }),
      mockCategory({ category_id: "21", category_name: "Hindi Series" }),
    ]);
  }),

  http.get(`${API}/series/list/:categoryId`, async () => {
    return HttpResponse.json([mockSeriesItem(), mockSeriesItem()]);
  }),

  http.get(`${API}/series/info/:seriesId`, async () => {
    return HttpResponse.json(mockSeriesInfo());
  }),

  // ── Search ───────────────────────────────────────────────────────────────

  http.get(`${API}/search`, async () => {
    return HttpResponse.json(mockSearchResults());
  }),

  // ── Favorites ────────────────────────────────────────────────────────────

  http.get(`${API}/favorites`, async () => {
    return HttpResponse.json([mockFavorite(), mockFavorite()]);
  }),

  http.post(`${API}/favorites/:contentId`, async () => {
    return HttpResponse.json(mockFavorite());
  }),

  http.delete(`${API}/favorites/:contentId`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── History ──────────────────────────────────────────────────────────────

  http.get(`${API}/history`, async () => {
    return HttpResponse.json([mockWatchHistory(), mockWatchHistory()]);
  }),

  http.put(`${API}/history/:contentId`, async () => {
    return HttpResponse.json({ message: "Updated" });
  }),

  http.delete(`${API}/history`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API}/history/:contentId`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Stream proxy (passthrough — real tests won't hit this) ───────────────

  http.get(`${API}/stream/:type/:id`, async () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
