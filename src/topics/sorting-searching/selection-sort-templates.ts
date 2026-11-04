import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `void selectionSort(int a[], int n) { // @start
  for (int i = 0; i < n - 1; i++) { // @pass
    int min = i;
    for (int j = i + 1; j < n; j++) {
      if (a[j] < a[min]) { // @compare
        min = j; // @minimum
      }
    }
    if (min != i) {
      int temp = a[i]; a[i] = a[min]; a[min] = temp; // @swap
    } // @settle
  }
} // @done`,
  "C++": `void selectionSort(std::vector<int>& a) { // @start
  int n = static_cast<int>(a.size());
  for (int i = 0; i < n - 1; ++i) { // @pass
    int min = i;
    for (int j = i + 1; j < n; ++j) {
      if (a[j] < a[min]) { // @compare
        min = j; // @minimum
      }
    }
    if (min != i) {
      std::swap(a[i], a[min]); // @swap
    } // @settle
  }
} // @done`,
  Python: `def selection_sort(a): # @start
    for i in range(len(a) - 1): # @pass
        minimum = i
        for j in range(i + 1, len(a)):
            if a[j] < a[minimum]: # @compare
                minimum = j # @minimum
        if minimum != i:
            a[i], a[minimum] = a[minimum], a[i] # @swap
        # 本轮最小值归位到 i。 # @settle
    return a # @done`,
  Go: `func selectionSort(a []int) { // @start
    for i := 0; i < len(a) - 1; i++ { // @pass
        min := i
        for j := i + 1; j < len(a); j++ {
            if a[j] < a[min] { // @compare
                min = j // @minimum
            }
        }
        if min != i {
            a[i], a[min] = a[min], a[i] // @swap
        } // @settle
    }
} // @done`,
  Java: `void selectionSort(int[] a) { // @start
    for (int i = 0; i < a.length - 1; i++) { // @pass
        int min = i;
        for (int j = i + 1; j < a.length; j++) {
            if (a[j] < a[min]) { // @compare
                min = j; // @minimum
            }
        }
        if (min != i) {
            int temp = a[i]; a[i] = a[min]; a[min] = temp; // @swap
        } // @settle
    }
} // @done`,
  Rust: `fn selection_sort(a: &mut [i32]) { // @start
    for i in 0..a.len().saturating_sub(1) { // @pass
        let mut min = i;
        for j in i + 1..a.len() {
            if a[j] < a[min] { // @compare
                min = j; // @minimum
            }
        }
        if min != i {
            a.swap(i, min); // @swap
        } // @settle
    }
} // @done`,
};
