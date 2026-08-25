import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ProgressBar from "~/components/ProgressBar.vue";
import ProgressRing from "~/components/ProgressRing.vue";
import QuantityStepper from "~/components/QuantityStepper.vue";


describe("ProgressBar", () => {
  it("renders bar with correct width percent", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: 50, max: 100 },
    });
    const inner = wrapper.find("i");
    expect(inner.attributes("style")).toContain("width: 50%");
  });

  it("clamps to 0 when value is negative", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: -10, max: 100 },
    });
    expect(wrapper.find("i").attributes("style")).toContain("width: 0%");
  });

  it("clamps to 100 when value exceeds max", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: 200, max: 100 },
    });
    expect(wrapper.find("i").attributes("style")).toContain("width: 100%");
  });

  it("shows min-mark span when minMark provided and max > 0", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: 50, max: 100, minMark: 20 },
    });
    expect(wrapper.find(".min-mark").exists()).toBe(true);
  });

  it("hides min-mark when minMark is null", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: 50, max: 100 },
    });
    expect(wrapper.find(".min-mark").exists()).toBe(false);
  });

  it("handles max=0 without dividing by zero", async () => {
    const wrapper = await mountSuspended(ProgressBar, {
      props: { value: 0, max: 0 },
    });
    expect(wrapper.find("i").attributes("style")).toContain("width: 0%");
  });
});


describe("ProgressRing", () => {
  it("renders svg with correct pct text", async () => {
    const wrapper = await mountSuspended(ProgressRing, {
      props: { pct: 75 },
    });
    expect(wrapper.find("text").text()).toBe("75%");
  });

  it("renders at 0%", async () => {
    const wrapper = await mountSuspended(ProgressRing, {
      props: { pct: 0 },
    });
    expect(wrapper.find("text").text()).toBe("0%");
  });

  it("renders at 100%", async () => {
    const wrapper = await mountSuspended(ProgressRing, {
      props: { pct: 100 },
    });
    expect(wrapper.find("text").text()).toBe("100%");
  });
});


describe("QuantityStepper", () => {
  it("renders the current value", async () => {
    const wrapper = await mountSuspended(QuantityStepper, {
      props: { value: 3 },
    });
    expect(wrapper.text()).toContain("3");
  });

  it("emits change with value-1 on minus button click", async () => {
    const wrapper = await mountSuspended(QuantityStepper, {
      props: { value: 3 },
    });
    await wrapper.find("[aria-label='decrease']").trigger("click");
    expect(wrapper.emitted("change")).toEqual([[2]]);
  });

  it("emits change with value+1 on plus button click", async () => {
    const wrapper = await mountSuspended(QuantityStepper, {
      props: { value: 3 },
    });
    await wrapper.find("[aria-label='increase']").trigger("click");
    expect(wrapper.emitted("change")).toEqual([[4]]);
  });

  it("disables minus button when value <= min", async () => {
    const wrapper = await mountSuspended(QuantityStepper, {
      props: { value: 0, min: 0 },
    });
    const minus = wrapper.find("[aria-label='decrease']");
    expect(minus.attributes("disabled")).toBeDefined();
  });
});
