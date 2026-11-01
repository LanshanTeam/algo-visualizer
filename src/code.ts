import type { Language, Operation, Topic } from "./trace";
export const languages: Language[] = ["C", "C++", "Python", "Go", "Rust"];
type CodeLine = { text: string; anchor?: string };
const sortCode: Record<Language, string> = {
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
const linkedCode: Record<Language, Record<Operation, string>> = {
  C: {
    insert: `Node* insert(Node* head, int index, int value) { // @start
  Node *prev = NULL, *curr = head;
  for (int i = 0; i < index; i++) {
    prev = curr; curr = curr->next; // @walk
  }
  Node* node = malloc(sizeof *node); // @allocate
  if (!node) return head;
  node->value = value;
  node->next = curr; // @connect
  if (prev) prev->next = node; else head = node; // @commit
  return head;
} // @done`,
    delete: `Node* removeAt(Node* head, int index) { // @start
  Node *prev = NULL, *curr = head;
  for (int i = 0; i < index; i++) {
    prev = curr; curr = curr->next; // @walk
  }
  if (prev) prev->next = curr->next; else head = curr->next; // @bypass
  free(curr); // @remove
  return head;
} // @done`,
    find: `int get(Node* head, int index) { // @start
  Node* curr = head;
  for (int i = 0; i < index; i++) {
    curr = curr->next; // @walk
  }
  return curr->value; // @result
} // @done`,
  },
  Python: {
    insert: `def insert(head, index, value): # @start
    prev, curr = None, head
    for _ in range(index):
        prev, curr = curr, curr.next # @walk
    node = Node(value) # @allocate
    node.next = curr # @connect
    if prev: prev.next = node # @commit
    else: head = node
    return head # @done`,
    delete: `def remove(head, index): # @start
    prev, curr = None, head
    for _ in range(index):
        prev, curr = curr, curr.next # @walk
    if prev: prev.next = curr.next # @bypass
    else: head = curr.next
    curr = None # @remove
    return head # @done`,
    find: `def get(head, index): # @start
    curr = head
    for _ in range(index):
        curr = curr.next # @walk
    return curr.value # @result
# @done`,
  },
  "C++": {
    insert: `Node* insert(Node* head, int index, int value) { // @start
  Node *prev = nullptr, *curr = head;
  for (int i = 0; i < index; ++i) {
    prev = curr; curr = curr->next; // @walk
  }
  Node* node = new Node{value, nullptr}; // @allocate
  node->next = curr; // @connect
  if (prev) prev->next = node; else head = node; // @commit
  return head;
} // @done`,
    delete: `Node* remove(Node* head, int index) { // @start
  Node *prev = nullptr, *curr = head;
  for (int i = 0; i < index; ++i) {
    prev = curr; curr = curr->next; // @walk
  }
  if (prev) prev->next = curr->next; else head = curr->next; // @bypass
  delete curr; // @remove
  return head;
} // @done`,
    find: `int get(Node* head, int index) { // @start
  Node* curr = head;
  for (int i = 0; i < index; ++i) {
    curr = curr->next; // @walk
  }
  return curr->value; // @result
} // @done`,
  },
  Go: {
    insert: `func insert(head *Node, index, value int) *Node { // @start
    var prev *Node
    curr := head
    for i := 0; i < index; i++ {
        prev, curr = curr, curr.next // @walk
    }
    node := &Node{value: value} // @allocate
    node.next = curr // @connect
    if prev != nil { prev.next = node } else { head = node } // @commit
    return head
} // @done`,
    delete: `func remove(head *Node, index int) *Node { // @start
    var prev *Node
    curr := head
    for i := 0; i < index; i++ {
        prev, curr = curr, curr.next // @walk
    }
    if prev != nil { prev.next = curr.next } else { head = curr.next } // @bypass
    curr = nil // @remove
    return head
} // @done`,
    find: `func get(head *Node, index int) int { // @start
    curr := head
    for i := 0; i < index; i++ {
        curr = curr.next // @walk
    }
    return curr.value // @result
} // @done`,
  },
  Rust: {
    insert: `fn insert(head: &mut Option<Box<Node>>, index: usize, value: i32) { // @start
    let mut link = head;
    for _ in 0..index {
        link = &mut link.as_mut().unwrap().next; // @walk
    }
    let mut node = Box::new(Node { value, next: None }); // @allocate
    node.next = link.take(); // @connect
    *link = Some(node); // @commit
} // @done`,
    delete: `fn remove(head: &mut Option<Box<Node>>, index: usize) { // @start
    let mut link = head;
    for _ in 0..index {
        link = &mut link.as_mut().unwrap().next; // @walk
    }
    let mut removed = link.take().unwrap();
    *link = removed.next.take(); // @bypass
    drop(removed); // @remove
} // @done`,
    find: `fn get(head: &Option<Box<Node>>, index: usize) -> i32 { // @start
    let mut curr = head.as_ref();
    for _ in 0..index {
        curr = curr.unwrap().next.as_ref(); // @walk
    }
    curr.unwrap().value // @result
} // @done`,
  },
};
export function getCode(
  topic: Topic,
  language: Language,
  operation: Operation,
): CodeLine[] {
  return (
    topic === "quick-sort"
      ? sortCode[language]
      : linkedCode[language][operation]
  )
    .split("\n")
    .map((line) => ({
      text: line.replace(/\s*(\/\/|#) @\w+/, ""),
      anchor: line.match(/@(\w+)/)?.[1],
    }));
}
