import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `void bubbleSort(int a[], int n) { // @start
  for (int end = n - 1; end > 0; end--) { // @pass
    int swapped = 0;
    for (int j = 0; j < end; j++) {
      if (a[j] > a[j + 1]) { // @compare
        int temp = a[j]; a[j] = a[j + 1]; a[j + 1] = temp; // @swap
        swapped = 1;
      }
    } // @settle
    if (!swapped) break; // @early
  }
} // @done`,
  "C++": `void bubbleSort(std::vector<int>& a) { // @start
  for (int end = static_cast<int>(a.size()) - 1; end > 0; --end) { // @pass
    bool swapped = false;
    for (int j = 0; j < end; ++j) {
      if (a[j] > a[j + 1]) { // @compare
        std::swap(a[j], a[j + 1]); // @swap
        swapped = true;
      }
    } // @settle
    if (!swapped) break; // @early
  }
} // @done`,
  Python: `def bubble_sort(a): # @start
    for end in range(len(a) - 1, 0, -1): # @pass
        swapped = False
        for j in range(end):
            if a[j] > a[j + 1]: # @compare
                a[j], a[j + 1] = a[j + 1], a[j] # @swap
                swapped = True
        # 本轮最大值归位到 end。 # @settle
        if not swapped: break # @early
    return a # @done`,
  Go: `func bubbleSort(a []int) { // @start
    for end := len(a) - 1; end > 0; end-- { // @pass
        swapped := false
        for j := 0; j < end; j++ {
            if a[j] > a[j + 1] { // @compare
                a[j], a[j + 1] = a[j + 1], a[j] // @swap
                swapped = true
            }
        } // @settle
        if !swapped { break } // @early
    }
} // @done`,
  Java: `void bubbleSort(int[] a) { // @start
    for (int end = a.length - 1; end > 0; end--) { // @pass
        boolean swapped = false;
        for (int j = 0; j < end; j++) {
            if (a[j] > a[j + 1]) { // @compare
                int temp = a[j]; a[j] = a[j + 1]; a[j + 1] = temp; // @swap
                swapped = true;
            }
        } // @settle
        if (!swapped) break; // @early
    }
} // @done`,
  Rust: `fn bubble_sort(a: &mut [i32]) { // @start
    for end in (1..a.len()).rev() { // @pass
        let mut swapped = false;
        for j in 0..end {
            if a[j] > a[j + 1] { // @compare
                a.swap(j, j + 1); // @swap
                swapped = true;
            }
        } // @settle
        if !swapped { break; } // @early
    }
} // @done`,
};
