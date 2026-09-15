/* Service worker PTR PERSCOM — notificações push */
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (err) {
    data = { corpo: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(data.titulo || "PTR PERSCOM", {
      body: data.corpo || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const w of list) {
          if ("focus" in w) {
            w.navigate(url);
            return w.focus();
          }
        }
        return clients.openWindow(url);
      })
      .catch(() => null),
  );
});
