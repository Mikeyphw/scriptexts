(function () {
  "use strict";

  class SyncAdapter {
    async isAvailable() { return false; }
    async connect() { throw new Error("Sync provider is not implemented yet."); }
    async disconnect() {}
    async getStatus() { return { connected: false, provider: "none" }; }
    async pull() { throw new Error("Pull is not implemented yet."); }
    async push() { throw new Error("Push is not implemented yet."); }
    async sync() { throw new Error("Sync is not implemented yet."); }
  }

  class LocalSyncAdapter extends SyncAdapter {
    async isAvailable() { return true; }
    async getStatus() { return { connected: true, provider: "local", message: "Local-only library" }; }
    async sync(localSnapshot) { return { ok: true, provider: "local", snapshot: localSnapshot }; }
  }

  class GoogleDriveSyncAdapter extends SyncAdapter {
    async isAvailable() { return false; }
    async getStatus() {
      return {
        connected: true,
        provider: "google-drive",
        message: "Google Drive manual sync is available through the background sync adapter.",
      };
    }
  }

  window.MRMSync = {
    SyncAdapter,
    LocalSyncAdapter,
    GoogleDriveSyncAdapter,
    providers: {
      local: new LocalSyncAdapter(),
      "google-drive": new GoogleDriveSyncAdapter(),
    },
  };
})();