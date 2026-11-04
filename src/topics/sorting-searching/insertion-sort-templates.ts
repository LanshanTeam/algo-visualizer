import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `void insertionSort(int a[], int n) { // @start
  for (int i = 1; i < n; i++) {
    int key = a[i], j = i - 1; // @hold
    while (j >= 0 && a[j] > key) { // @compare
      a[j + 1] = a[j]; j--; // @shift
    }
    a[j + 1] = key; // @insert
  }
} // @done`,
  "C++": `void insertionSort(std::vector<int>& a) { // @start
  for (int i = 1; i < static_cast<int>(a.size()); ++i) {
    int key = a[i], j = i - 1; // @hold
    while (j >= 0 && a[j] > key) { // @compare
      a[j + 1] = a[j]; --j; // @shift
    }
    a[j + 1] = key; // @insert
  }
} // @done`,
  Python: `def insertion_sort(a): # @start
    for i in range(1, len(a)):
        key, j = a[i], i - 1 # @hold
        while j >= 0 and a[j] > key: # @compare
            a[j + 1] = a[j]; j -= 1 # @shift
        a[j + 1] = key # @insert
# @done`,
  Go: `func insertionSort(a []int) { // @start
    for i := 1; i < len(a); i++ {
        key, j := a[i], i - 1 // @hold
        for j >= 0 && a[j] > key { // @compare
            a[j + 1] = a[j]; j-- // @shift
        }
        a[j + 1] = key // @insert
    }
} // @done`,
  Java: `void insertionSort(int[] a) { // @start
    for (int i = 1; i < a.length; i++) {
        int key = a[i], j = i - 1; // @hold
        while (j >= 0 && a[j] > key) { // @compare
            a[j + 1] = a[j]; j--; // @shift
        }
        a[j + 1] = key; // @insert
    }
} // @done`,
  Rust: `fn insertion_sort(a: &mut [i32]) { // @start
    for i in 1..a.len() {
        let key = a[i]; let mut j = i as isize - 1; // @hold
        while j >= 0 && a[j as usize] > key { // @compare
            a[(j + 1) as usize] = a[j as usize]; j -= 1; // @shift
        }
        a[(j + 1) as usize] = key; // @insert
    }
} // @done`,
};
