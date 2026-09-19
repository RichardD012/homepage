---
title: Bindery
description: Bindery Widget Configuration
---

Learn more about [Bindery](https://github.com/vavallee/bindery).

Find your API key under `Settings > General > Security`.

Allowed fields: `["wanted", "queued", "books"]`.

```yaml
widget:
  type: bindery
  url: http://bindery.host.or.ip:8787
  key: apikeyapikeyapikeyapikeyapikey
```

!!! note

    If Bindery is served under a reverse-proxy subpath (`BINDERY_URL_BASE`), include that path in `url`.
