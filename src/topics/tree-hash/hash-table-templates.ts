import type { Language } from "../../core/types";

// 只展示操作函数；Entry / Node、new_node 与 7 个桶视为已定义。
// 链地址法使用尾插法，哈希行统一对负键做归一化。
export const templates: Record<Language, Record<string, string>> = {
  C: {
    create: `void build(int *keys, int n, Node *table[7]) { // @start
  for (int i = 0; i < n; i++) {
    int key = keys[i];
    int bucket = ((key % 7) + 7) % 7; // @hash
    Node **link = &table[bucket];
    while (*link) { // @compare
      if ((*link)->key == key) break;
      link = &(*link)->next;
    }
    if (!*link) *link = new_node(key); // @insert
  }
} // @done`,
    search: `Node* search(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node *node = table[bucket];
  while (node) { // @compare
    if (node->key == key) return node; // @found
    node = node->next;
  }
  return NULL; // @miss
} // @done`,
    insert: `void insert(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node **link = &table[bucket];
  while (*link) { // @compare
    if ((*link)->key == key) return; // @exists
    link = &(*link)->next;
  }
  *link = new_node(key); // @insert
} // @done`,
    delete: `void delete_key(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node **link = &table[bucket];
  while (*link && (*link)->key != key) link = &(*link)->next; // @compare
  if (!*link) return; // @miss
  Node *target = *link; // @found
  *link = target->next; // @remove
  free(target);
} // @done`,
  },
  "C++": {
    create: `void build(const std::vector<int>& keys, Node *table[7]) { // @start
  for (int key : keys) {
    int bucket = ((key % 7) + 7) % 7; // @hash
    Node **link = &table[bucket];
    while (*link) { // @compare
      if ((*link)->key == key) break;
      link = &(*link)->next;
    }
    if (!*link) *link = new Node{key, nullptr}; // @insert
  }
} // @done`,
    search: `Node* search(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node *node = table[bucket];
  while (node) { // @compare
    if (node->key == key) return node; // @found
    node = node->next;
  }
  return nullptr; // @miss
} // @done`,
    insert: `void insert(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node **link = &table[bucket];
  while (*link) { // @compare
    if ((*link)->key == key) return; // @exists
    link = &(*link)->next;
  }
  *link = new Node{key, nullptr}; // @insert
} // @done`,
    delete: `void deleteKey(Node *table[7], int key) { // @start
  int bucket = ((key % 7) + 7) % 7; // @hash
  Node **link = &table[bucket];
  while (*link && (*link)->key != key) link = &(*link)->next; // @compare
  if (!*link) return; // @miss
  Node *target = *link; // @found
  *link = target->next; // @remove
  delete target;
} // @done`,
  },
  Python: {
    create: `def build(keys): # @start
    table = [None] * 7
    for key in keys:
        bucket = ((key % 7) + 7) % 7 # @hash
        prev = None
        node = table[bucket]
        while node: # @compare
            if node.key == key:
                break
            prev = node
            node = node.next
        if node is None:
            fresh = Node(key) # @insert
            if prev is None:
                table[bucket] = fresh
            else:
                prev.next = fresh
    return table # @done`,
    search: `def search(table, key): # @start
    bucket = ((key % 7) + 7) % 7 # @hash
    node = table[bucket]
    while node: # @compare
        if node.key == key:
            return node # @found
        node = node.next
    return None # @miss
# @done`,
    insert: `def insert(table, key): # @start
    bucket = ((key % 7) + 7) % 7 # @hash
    prev = None
    node = table[bucket]
    while node: # @compare
        if node.key == key:
            return # @exists
        prev = node
        node = node.next
    fresh = Node(key) # @insert
    if prev is None:
        table[bucket] = fresh
    else:
        prev.next = fresh
# @done`,
    delete: `def delete_key(table, key): # @start
    bucket = ((key % 7) + 7) % 7 # @hash
    prev = None
    node = table[bucket]
    while node: # @compare
        if node.key == key:
            break
        prev = node
        node = node.next
    if node is None:
        return # @miss
    target = node # @found
    if prev is None:
        table[bucket] = target.next # @remove
    else:
        prev.next = target.next # @remove
# @done`,
  },
  Go: {
    create: `func build(keys []int) []*Node { // @start
    table := make([]*Node, 7)
    for _, key := range keys {
        bucket := ((key % 7) + 7) % 7 // @hash
        link := &table[bucket]
        for *link != nil { // @compare
            if (*link).key == key {
                break
            }
            link = &(*link).next
        }
        if *link == nil {
            *link = &Node{key: key} // @insert
        }
    }
    return table // @done
}`,
    search: `func search(table []*Node, key int) *Node { // @start
    bucket := ((key % 7) + 7) % 7 // @hash
    node := table[bucket]
    for node != nil { // @compare
        if node.key == key {
            return node // @found
        }
        node = node.next
    }
    return nil // @miss
} // @done`,
    insert: `func insert(table []*Node, key int) { // @start
    bucket := ((key % 7) + 7) % 7 // @hash
    link := &table[bucket]
    for *link != nil { // @compare
        if (*link).key == key {
            return // @exists
        }
        link = &(*link).next
    }
    *link = &Node{key: key} // @insert
} // @done`,
    delete: `func deleteKey(table []*Node, key int) { // @start
    bucket := ((key % 7) + 7) % 7 // @hash
    link := &table[bucket]
    for *link != nil && (*link).key != key { // @compare
        link = &(*link).next
    }
    if *link == nil {
        return // @miss
    }
    target := *link // @found
    *link = target.next // @remove
} // @done`,
  },
  Java: {
    create: `void build(int[] keys, Node[] table) { // @start
    for (int key : keys) {
        int bucket = ((key % 7) + 7) % 7; // @hash
        Node prev = null;
        Node node = table[bucket];
        while (node != null) { // @compare
            if (node.key == key) break;
            prev = node;
            node = node.next;
        }
        if (node == null) {
            Node fresh = new Node(key); // @insert
            if (prev == null) table[bucket] = fresh;
            else prev.next = fresh;
        }
    }
} // @done`,
    search: `Node search(Node[] table, int key) { // @start
    int bucket = ((key % 7) + 7) % 7; // @hash
    Node node = table[bucket];
    while (node != null) { // @compare
        if (node.key == key) return node; // @found
        node = node.next;
    }
    return null; // @miss
} // @done`,
    insert: `void insert(Node[] table, int key) { // @start
    int bucket = ((key % 7) + 7) % 7; // @hash
    Node prev = null;
    Node node = table[bucket];
    while (node != null) { // @compare
        if (node.key == key) return; // @exists
        prev = node;
        node = node.next;
    }
    Node fresh = new Node(key); // @insert
    if (prev == null) table[bucket] = fresh;
    else prev.next = fresh;
} // @done`,
    delete: `void deleteKey(Node[] table, int key) { // @start
    int bucket = ((key % 7) + 7) % 7; // @hash
    Node prev = null;
    Node node = table[bucket];
    while (node != null) { // @compare
        if (node.key == key) break;
        prev = node;
        node = node.next;
    }
    if (node == null) return; // @miss
    Node target = node; // @found
    if (prev == null) table[bucket] = target.next; // @remove
    else prev.next = target.next; // @remove
} // @done`,
  },
  Rust: {
    create: `fn build(keys: &[i32], buckets: &mut [Option<usize>; 7], nodes: &mut Vec<Entry>) { // @start
    for &key in keys {
        let bucket = (((key % 7) + 7) % 7) as usize; // @hash
        let mut link = buckets[bucket];
        while let Some(i) = link { // @compare
            if nodes[i].key == key {
                break;
            }
            link = nodes[i].next;
        }
        if link.is_none() {
            let id = nodes.len();
            nodes.push(Entry { key, next: None }); // @insert
            if buckets[bucket].is_none() {
                buckets[bucket] = Some(id);
            } else {
                let mut prev = buckets[bucket].unwrap();
                while nodes[prev].next.is_some() {
                    prev = nodes[prev].next.unwrap();
                }
                nodes[prev].next = Some(id);
            }
        }
    }
} // @done`,
    search: `fn search(buckets: &[Option<usize>; 7], nodes: &[Entry], key: i32) -> Option<usize> { // @start
    let bucket = (((key % 7) + 7) % 7) as usize; // @hash
    let mut link = buckets[bucket];
    while let Some(i) = link { // @compare
        if nodes[i].key == key {
            return Some(i); // @found
        }
        link = nodes[i].next;
    }
    None // @miss
} // @done`,
    insert: `fn insert(buckets: &mut [Option<usize>; 7], nodes: &mut Vec<Entry>, key: i32) { // @start
    let bucket = (((key % 7) + 7) % 7) as usize; // @hash
    let mut link = buckets[bucket];
    while let Some(i) = link { // @compare
        if nodes[i].key == key {
            return; // @exists
        }
        link = nodes[i].next;
    }
    let id = nodes.len();
    nodes.push(Entry { key, next: None }); // @insert
    if buckets[bucket].is_none() {
        buckets[bucket] = Some(id);
    } else {
        let mut prev = buckets[bucket].unwrap();
        while nodes[prev].next.is_some() {
            prev = nodes[prev].next.unwrap();
        }
        nodes[prev].next = Some(id);
    }
} // @done`,
    delete: `fn delete_key(buckets: &mut [Option<usize>; 7], nodes: &mut Vec<Entry>, key: i32) { // @start
    let bucket = (((key % 7) + 7) % 7) as usize; // @hash
    let mut prev: Option<usize> = None;
    let mut link = buckets[bucket];
    while let Some(i) = link { // @compare
        if nodes[i].key == key {
            break;
        }
        prev = link;
        link = nodes[i].next;
    }
    let Some(target) = link else { return; }; // @miss
    let next = nodes[target].next; // @found
    if let Some(p) = prev {
        nodes[p].next = next; // @remove
    } else {
        buckets[bucket] = next; // @remove
    }
} // @done`,
  },
};
