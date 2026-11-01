import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `void quickSort(int a[], int low, int high) { // @start
  if (low >= high) return; // @base
  int pivot = a[high]; // @pivot
  int i = low;
  for (int j = low; j < high; j++) {
    if (a[j] < pivot) { // @compare
      int temp = a[i]; a[i] = a[j]; a[j] = temp; // @swap
      i++; // @advance
    }
  }
  int temp = a[i]; a[i] = a[high]; a[high] = temp; // @place
  quickSort(a, low, i - 1); // @recurse
  quickSort(a, i + 1, high);
} // @done`,
  Python: `def quick_sort(a, low, high): # @start
    if low >= high: return # @base
    pivot = a[high] # @pivot
    i = low
    for j in range(low, high):
        if a[j] < pivot: # @compare
            a[i], a[j] = a[j], a[i] # @swap
            i += 1 # @advance
    a[i], a[high] = a[high], a[i] # @place
    quick_sort(a, low, i - 1) # @recurse
    quick_sort(a, i + 1, high)
# @done`,
  "C++": `void quickSort(vector<int>& a, int low, int high) { // @start
  if (low >= high) return; // @base
  int pivot = a[high]; // @pivot
  int i = low;
  for (int j = low; j < high; ++j) {
    if (a[j] < pivot) { // @compare
      std::swap(a[i], a[j]); // @swap
      ++i; // @advance
    }
  }
  std::swap(a[i], a[high]); // @place
  quickSort(a, low, i - 1); // @recurse
  quickSort(a, i + 1, high);
} // @done`,
  Go: `func quickSort(a []int, low, high int) { // @start
    if low >= high { return } // @base
    pivot := a[high] // @pivot
    i := low
    for j := low; j < high; j++ {
        if a[j] < pivot { // @compare
            a[i], a[j] = a[j], a[i] // @swap
            i++ // @advance
        }
    }
    a[i], a[high] = a[high], a[i] // @place
    quickSort(a, low, i - 1) // @recurse
    quickSort(a, i + 1, high)
} // @done`,
  Java: `void quickSort(int[] a, int low, int high) { // @start
    if (low >= high) return; // @base
    int pivot = a[high]; // @pivot
    int i = low;
    for (int j = low; j < high; j++) {
        if (a[j] < pivot) { // @compare
            int temp = a[i]; a[i] = a[j]; a[j] = temp; // @swap
            i++; // @advance
        }
    }
    int temp = a[i]; a[i] = a[high]; a[high] = temp; // @place
    quickSort(a, low, i - 1); // @recurse
    quickSort(a, i + 1, high);
} // @done`,
  Rust: `fn quick_sort(a: &mut [i32]) { // @start
    if a.len() <= 1 { return; } // @base
    let high = a.len() - 1;
    let pivot = a[high]; // @pivot
    let mut i = 0;
    for j in 0..high {
        if a[j] < pivot { // @compare
            a.swap(i, j); // @swap
            i += 1; // @advance
        }
    }
    a.swap(i, high); // @place
    let (left, right) = a.split_at_mut(i);
    quick_sort(left); // @recurse
    quick_sort(&mut right[1..]);
} // @done`,
};
