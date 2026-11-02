import type { Language } from "../../core/types";

export const templates: Record<Language, string> = {
  C: `// 前提：a 已按非递减顺序排列。
int binarySearch(const int a[], int n, int target) { // @start
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = low + (high - low) / 2; // @mid
    if (a[mid] == target) return mid; // @found
    if (a[mid] < target) { // @compare
      low = mid + 1; // @right
    } else {
      high = mid - 1; // @left
    }
  }
  return -1; // @missing
}`,
  "C++": `// 前提：a 已按非递减顺序排列。
int binarySearch(const std::vector<int>& a, int target) { // @start
  int low = 0, high = static_cast<int>(a.size()) - 1;
  while (low <= high) {
    int mid = low + (high - low) / 2; // @mid
    if (a[mid] == target) return mid; // @found
    if (a[mid] < target) { // @compare
      low = mid + 1; // @right
    } else {
      high = mid - 1; // @left
    }
  }
  return -1; // @missing
}`,
  Python: `# 前提：a 已按非递减顺序排列。
def binary_search(a, target): # @start
    low, high = 0, len(a) - 1
    while low <= high:
        mid = low + (high - low) // 2 # @mid
        if a[mid] == target: return mid # @found
        if a[mid] < target: # @compare
            low = mid + 1 # @right
        else:
            high = mid - 1 # @left
    return -1 # @missing`,
  Go: `// 前提：a 已按非递减顺序排列。
func binarySearch(a []int, target int) int { // @start
    low, high := 0, len(a) - 1
    for low <= high {
        mid := low + (high - low) / 2 // @mid
        if a[mid] == target { return mid } // @found
        if a[mid] < target { // @compare
            low = mid + 1 // @right
        } else {
            high = mid - 1 // @left
        }
    }
    return -1 // @missing
}`,
  Java: `// 前提：a 已按非递减顺序排列。
int binarySearch(int[] a, int target) { // @start
    int low = 0, high = a.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2; // @mid
        if (a[mid] == target) return mid; // @found
        if (a[mid] < target) { // @compare
            low = mid + 1; // @right
        } else {
            high = mid - 1; // @left
        }
    }
    return -1; // @missing
}`,
  Rust: `// 前提：a 已按非递减顺序排列。
fn binary_search(a: &[i32], target: i32) -> isize { // @start
    let (mut low, mut high) = (0_isize, a.len() as isize - 1);
    while low <= high {
        let mid = low + (high - low) / 2; // @mid
        if a[mid as usize] == target { return mid; } // @found
        if a[mid as usize] < target { // @compare
            low = mid + 1; // @right
        } else {
            high = mid - 1; // @left
        }
    }
    -1 // @missing
}`,
};
