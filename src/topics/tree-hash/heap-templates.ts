import type { Language } from "../../core/types";

// 以小顶堆为例；i 的父节点为 (i - 1) / 2，左右孩子为 2i + 1、2i + 2。
// 只展示核心操作，数组与交换函数视为已定义。
export const templates: Record<Language, Record<string, string>> = {
  C: {
    create: `void build(int *keys, int n, int *heap) { // @start
  for (int i = 0; i < n; i++) {
    heap[i] = keys[i]; // @append
    int j = i;
    while (j > 0) { // @compare
      int parent = (j - 1) / 2;
      if (heap[parent] <= heap[j]) break;
      swap(&heap[parent], &heap[j]); // @swap
      j = parent;
    }
  }
} // @done`,
    insert: `void insert(int *heap, int *n, int value) { // @start
  heap[*n] = value; // @append
  int j = *n;
  (*n)++;
  while (j > 0) { // @compare
    int parent = (j - 1) / 2;
    if (heap[parent] <= heap[j]) break;
    swap(&heap[parent], &heap[j]); // @swap
    j = parent;
  }
} // @done`,
    extract: `int extract_min(int *heap, int *n) { // @start
  int minimum = heap[0];
  int last = heap[--(*n)];
  if (*n == 0) return minimum;
  heap[0] = last; // @replace
  int i = 0;
  while (1) {
    int left = 2 * i + 1;
    if (left >= *n) break;
    int child = left;
    if (left + 1 < *n && heap[left + 1] < heap[left]) child = left + 1;
    if (heap[i] <= heap[child]) break; // @compare
    swap(&heap[i], &heap[child]); // @swap
    i = child;
  }
  return minimum;
} // @done`,
  },
  "C++": {
    create: `void build(const std::vector<int>& keys, std::vector<int>& heap) { // @start
  for (int i = 0; i < (int)keys.size(); i++) {
    heap.push_back(keys[i]); // @append
    int j = i;
    while (j > 0) { // @compare
      int parent = (j - 1) / 2;
      if (heap[parent] <= heap[j]) break;
      std::swap(heap[parent], heap[j]); // @swap
      j = parent;
    }
  }
} // @done`,
    insert: `void insert(std::vector<int>& heap, int value) { // @start
  heap.push_back(value); // @append
  int j = (int)heap.size() - 1;
  while (j > 0) { // @compare
    int parent = (j - 1) / 2;
    if (heap[parent] <= heap[j]) break;
    std::swap(heap[parent], heap[j]); // @swap
    j = parent;
  }
} // @done`,
    extract: `int extractMin(std::vector<int>& heap) { // @start
  int minimum = heap.front();
  int last = heap.back();
  heap.pop_back();
  if (heap.empty()) return minimum;
  heap[0] = last; // @replace
  int i = 0;
  while (true) {
    int left = 2 * i + 1;
    if (left >= (int)heap.size()) break;
    int child = left;
    if (left + 1 < (int)heap.size() && heap[left + 1] < heap[left]) child = left + 1;
    if (heap[i] <= heap[child]) break; // @compare
    std::swap(heap[i], heap[child]); // @swap
    i = child;
  }
  return minimum;
} // @done`,
  },
  Python: {
    create: `def build(keys): # @start
    heap = []
    for value in keys:
        heap.append(value) # @append
        j = len(heap) - 1
        while j > 0: # @compare
            parent = (j - 1) // 2
            if heap[parent] <= heap[j]:
                break
            heap[parent], heap[j] = heap[j], heap[parent] # @swap
            j = parent
    return heap # @done`,
    insert: `def insert(heap, value): # @start
    heap.append(value) # @append
    j = len(heap) - 1
    while j > 0: # @compare
        parent = (j - 1) // 2
        if heap[parent] <= heap[j]:
            break
        heap[parent], heap[j] = heap[j], heap[parent] # @swap
        j = parent
# @done`,
    extract: `def extract_min(heap): # @start
    minimum = heap[0]
    last = heap.pop()
    if not heap:
        return minimum
    heap[0] = last # @replace
    i = 0
    while True:
        left = 2 * i + 1
        if left >= len(heap):
            break
        child = left
        if left + 1 < len(heap) and heap[left + 1] < heap[left]:
            child = left + 1
        if heap[i] <= heap[child]:
            break # @compare
        heap[i], heap[child] = heap[child], heap[i] # @swap
        i = child
    return minimum # @done`,
  },
  Go: {
    create: `func build(keys []int) []int { // @start
    heap := []int{}
    for _, value := range keys {
        heap = append(heap, value) // @append
        j := len(heap) - 1
        for j > 0 { // @compare
            parent := (j - 1) / 2
            if heap[parent] <= heap[j] {
                break
            }
            heap[parent], heap[j] = heap[j], heap[parent] // @swap
            j = parent
        }
    }
    return heap // @done
}`,
    insert: `func insert(heap []int, value int) []int { // @start
    heap = append(heap, value) // @append
    j := len(heap) - 1
    for j > 0 { // @compare
        parent := (j - 1) / 2
        if heap[parent] <= heap[j] {
            break
        }
        heap[parent], heap[j] = heap[j], heap[parent] // @swap
        j = parent
    }
    return heap // @done
}`,
    extract: `func extractMin(heap []int) (int, []int) { // @start
    minimum := heap[0]
    last := heap[len(heap)-1]
    heap = heap[:len(heap)-1]
    if len(heap) == 0 {
        return minimum, heap
    }
    heap[0] = last // @replace
    i := 0
    for {
        left := 2*i + 1
        if left >= len(heap) {
            break
        }
        child := left
        if left+1 < len(heap) && heap[left+1] < heap[left] {
            child = left + 1
        }
        if heap[i] <= heap[child] {
            break // @compare
        }
        heap[i], heap[child] = heap[child], heap[i] // @swap
        i = child
    }
    return minimum, heap // @done
}`,
  },
  Java: {
    create: `void build(int[] keys, int[] heap) { // @start
    for (int i = 0; i < keys.length; i++) {
        heap[i] = keys[i]; // @append
        int j = i;
        while (j > 0) { // @compare
            int parent = (j - 1) / 2;
            if (heap[parent] <= heap[j]) break;
            int temp = heap[parent];
            heap[parent] = heap[j];
            heap[j] = temp; // @swap
            j = parent;
        }
    }
} // @done`,
    insert: `void insert(int[] heap, int size, int value) { // @start
    heap[size] = value; // @append
    int j = size;
    while (j > 0) { // @compare
        int parent = (j - 1) / 2;
        if (heap[parent] <= heap[j]) break;
        int temp = heap[parent];
        heap[parent] = heap[j];
        heap[j] = temp; // @swap
        j = parent;
    }
} // @done`,
    extract: `int extractMin(int[] heap, int size) { // @start
    int minimum = heap[0];
    int last = heap[size - 1];
    size--;
    if (size == 0) return minimum;
    heap[0] = last; // @replace
    int i = 0;
    while (true) {
        int left = 2 * i + 1;
        if (left >= size) break;
        int child = left;
        if (left + 1 < size && heap[left + 1] < heap[left]) child = left + 1;
        if (heap[i] <= heap[child]) break; // @compare
        int temp = heap[i];
        heap[i] = heap[child];
        heap[child] = temp; // @swap
        i = child;
    }
    return minimum;
} // @done`,
  },
  Rust: {
    create: `fn build(keys: &[i32]) -> Vec<i32> { // @start
    let mut heap: Vec<i32> = Vec::new();
    for &value in keys {
        heap.push(value); // @append
        let mut j = heap.len() - 1;
        while j > 0 { // @compare
            let parent = (j - 1) / 2;
            if heap[parent] <= heap[j] {
                break;
            }
            heap.swap(parent, j); // @swap
            j = parent;
        }
    }
    heap // @done
}`,
    insert: `fn insert(heap: &mut Vec<i32>, value: i32) { // @start
    heap.push(value); // @append
    let mut j = heap.len() - 1;
    while j > 0 { // @compare
        let parent = (j - 1) / 2;
        if heap[parent] <= heap[j] {
            break;
        }
        heap.swap(parent, j); // @swap
        j = parent;
    }
} // @done`,
    extract: `fn extract_min(heap: &mut Vec<i32>) -> Option<i32> { // @start
    let minimum = heap.first().copied()?;
    let last = heap.pop()?;
    if heap.is_empty() {
        return Some(minimum);
    }
    heap[0] = last; // @replace
    let mut i = 0;
    loop {
        let left = 2 * i + 1;
        if left >= heap.len() {
            break;
        }
        let mut child = left;
        if left + 1 < heap.len() && heap[left + 1] < heap[left] {
            child = left + 1;
        }
        if heap[i] <= heap[child] {
            break; // @compare
        }
        heap.swap(i, child); // @swap
        i = child;
    }
    Some(minimum) // @done
}`,
  },
};
