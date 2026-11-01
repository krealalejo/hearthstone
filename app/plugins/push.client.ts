import { pushPlugin } from "~/composables/usePushNotifications";

export default defineNuxtPlugin(() => {
  pushPlugin()?.addListener("pushNotificationActionPerformed", (action) => {
    navigateTo(action.notification.data?.route ?? "/todos");
  });
});
