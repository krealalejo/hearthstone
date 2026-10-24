import { useNativeGoogleSignIn } from "~/composables/useNativeGoogleSignIn";

export default defineNuxtPlugin(() => {
  useNativeGoogleSignIn().listen();
});
