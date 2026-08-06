-- In-app browsers (Instagram/Facebook webview) often refuse to preload video
-- before user interaction, leaving grid thumbnails blank. A poster image is
-- generated client-side at upload time and always renders as a plain image.
alter table catalog_items add column poster_url text;
