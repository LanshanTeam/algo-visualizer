import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `#include <stdlib.h>
static void sort(int a[], int aux[], int low, int high) {
  if (low >= high) return; // @base
  int mid = low + (high - low) / 2; // @split
  sort(a, aux, low, mid); // @left
  sort(a, aux, mid + 1, high); // @right
  int i = low, j = mid + 1; // @merge
  for (int k = low; k <= high; k++) {
    int takeLeft = i <= mid && (j > high || a[i] <= a[j]); // @compare
    aux[k] = takeLeft ? a[i++] : a[j++]; // @write
  }
  for (int k = low; k <= high; k++) a[k] = aux[k]; // @copy
}
void mergeSort(int a[], int n) { // @start
  if (n <= 1) return;
  int *aux = malloc((size_t)n * sizeof *aux);
  if (aux == NULL) return;
  sort(a, aux, 0, n - 1);
  free(aux);
} // @done`,
  "C++": `#include <vector>
static void sort(std::vector<int>& a, std::vector<int>& aux, int low, int high) {
  if (low >= high) return; // @base
  int mid = low + (high - low) / 2; // @split
  sort(a, aux, low, mid); // @left
  sort(a, aux, mid + 1, high); // @right
  int i = low, j = mid + 1; // @merge
  for (int k = low; k <= high; ++k) {
    bool takeLeft = i <= mid && (j > high || a[i] <= a[j]); // @compare
    aux[k] = takeLeft ? a[i++] : a[j++]; // @write
  }
  for (int k = low; k <= high; ++k) a[k] = aux[k]; // @copy
}
void mergeSort(std::vector<int>& a) { // @start
  std::vector<int> aux(a.size());
  sort(a, aux, 0, static_cast<int>(a.size()) - 1);
} // @done`,
  Python: `def merge_sort(a): # @start
    aux = [None] * len(a)
    def sort(low, high):
        if low >= high: return # @base
        mid = (low + high) // 2 # @split
        sort(low, mid) # @left
        sort(mid + 1, high) # @right
        i, j = low, mid + 1 # @merge
        for k in range(low, high + 1):
            take_left = i <= mid and (j > high or a[i] <= a[j]) # @compare
            aux[k] = a[i] if take_left else a[j] # @write
            if take_left: i += 1
            else: j += 1
        a[low:high + 1] = aux[low:high + 1] # @copy
    sort(0, len(a) - 1)
# @done`,
  Go: `func mergeSort(a []int) { // @start
    aux := make([]int, len(a))
    var sort func(int, int)
    sort = func(low, high int) {
        if low >= high { return } // @base
        mid := low + (high - low) / 2 // @split
        sort(low, mid) // @left
        sort(mid + 1, high) // @right
        i, j := low, mid + 1 // @merge
        for k := low; k <= high; k++ {
            takeLeft := i <= mid && (j > high || a[i] <= a[j]) // @compare
            source := j
            if takeLeft { source = i; i++ } else { j++ }
            aux[k] = a[source] // @write
        }
        copy(a[low:high+1], aux[low:high+1]) // @copy
    }
    sort(0, len(a) - 1)
} // @done`,
  Java: `void mergeSort(int[] a) { // @start
    sort(a, new int[a.length], 0, a.length - 1);
} // @done
void sort(int[] a, int[] aux, int low, int high) {
    if (low >= high) return; // @base
    int mid = low + (high - low) / 2; // @split
    sort(a, aux, low, mid); // @left
    sort(a, aux, mid + 1, high); // @right
    int i = low, j = mid + 1; // @merge
    for (int k = low; k <= high; k++) {
        boolean takeLeft = i <= mid && (j > high || a[i] <= a[j]); // @compare
        aux[k] = takeLeft ? a[i++] : a[j++]; // @write
    }
    System.arraycopy(aux, low, a, low, high - low + 1); // @copy
}`,
  Rust: `fn merge_sort(a: &mut [i32]) { // @start
    fn sort(a: &mut [i32], aux: &mut [i32], low: usize, high: usize) {
        if low >= high { return; } // @base
        let mid = low + (high - low) / 2; // @split
        sort(a, aux, low, mid); // @left
        sort(a, aux, mid + 1, high); // @right
        let (mut i, mut j) = (low, mid + 1); // @merge
        for k in low..=high {
            let take_left = i <= mid && (j > high || a[i] <= a[j]); // @compare
            aux[k] = if take_left { let v = a[i]; i += 1; v }
                     else { let v = a[j]; j += 1; v }; // @write
        }
        a[low..=high].copy_from_slice(&aux[low..=high]); // @copy
    }
    let n = a.len();
    let mut aux = vec![0; n];
    if n > 0 { sort(a, &mut aux, 0, n - 1); }
} // @done`,
};
