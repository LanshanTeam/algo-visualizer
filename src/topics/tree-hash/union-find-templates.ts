import type { Language } from "../../core/types";

// 并查集教学片段：元素假定为连续的 0..n-1。
// 查找使用路径压缩，合并使用按秩合并；输入分组在创建时逐组成对合并。
export const templates: Record<Language, Record<string, string>> = {
  C: {
    create: `int find(int *parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

int unite(int *parent, int *rank, int a, int b) {
  int ra = find(parent, a);
  int rb = find(parent, b);
  if (ra == rb) return ra; // @compare
  if (rank[ra] < rank[rb]) {
    int temp = ra;
    ra = rb;
    rb = temp;
  }
  parent[rb] = ra; // @link
  if (rank[ra] == rank[rb]) rank[ra]++;
  return ra;
}

int build_group(int *group, int n, int offset,
                int *parent, int *rank) {
  if (n == 1) return group[offset];
  int mid = n / 2;
  int a = build_group(group, mid, offset, parent, rank);
  int b = build_group(group, n - mid, offset + mid, parent, rank);
  return unite(parent, rank, a, b);
}

void build(int **groups, int *sizes, int group_count,
           int *parent, int *rank) { // @start
  int n = 0;
  for (int g = 0; g < group_count; g++) n += sizes[g];
  for (int i = 0; i < n; i++) {
    parent[i] = i;
    rank[i] = 0; // @init
  }
  for (int g = 0; g < group_count; g++)
    build_group(groups[g], sizes[g], 0, parent, rank);
} // @done`,
    find: `int find(int *parent, int x) { // @start
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
} // @done`,
    union: `int find(int *parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

int unite(int *parent, int *rank, int a, int b) { // @start
  int ra = find(parent, a);
  int rb = find(parent, b);
  if (ra == rb) return ra; // @compare
  if (rank[ra] < rank[rb]) {
    int temp = ra;
    ra = rb;
    rb = temp;
  }
  parent[rb] = ra; // @link
  if (rank[ra] == rank[rb]) rank[ra]++;
  return ra;
} // @done`,
    connected: `int find(int *parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

int connected(int *parent, int a, int b) { // @start
  return find(parent, a) == find(parent, b); // @answer
} // @done`,
  },
  "C++": {
    create: `int find(std::vector<int>& parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

int unite(std::vector<int>& parent, std::vector<int>& rank, int a, int b) {
  int ra = find(parent, a);
  int rb = find(parent, b);
  if (ra == rb) return ra; // @compare
  if (rank[ra] < rank[rb]) std::swap(ra, rb);
  parent[rb] = ra; // @link
  if (rank[ra] == rank[rb]) rank[ra]++;
  return ra;
}

int buildGroup(const std::vector<int>& group, int left, int right,
               std::vector<int>& parent, std::vector<int>& rank) {
  if (right - left == 1) return group[left];
  int mid = (left + right) / 2;
  int a = buildGroup(group, left, mid, parent, rank);
  int b = buildGroup(group, mid, right, parent, rank);
  return unite(parent, rank, a, b);
}

void build(const std::vector<std::vector<int>>& groups,
           std::vector<int>& parent, std::vector<int>& rank) { // @start
  for (int i = 0; i < (int)parent.size(); i++) {
    parent[i] = i;
    rank[i] = 0; // @init
  }
  for (const auto& group : groups)
    buildGroup(group, 0, (int)group.size(), parent, rank);
} // @done`,
    find: `int find(std::vector<int>& parent, int x) { // @start
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
} // @done`,
    union: `int find(std::vector<int>& parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

int unite(std::vector<int>& parent, std::vector<int>& rank, int a, int b) { // @start
  int ra = find(parent, a);
  int rb = find(parent, b);
  if (ra == rb) return ra; // @compare
  if (rank[ra] < rank[rb]) std::swap(ra, rb);
  parent[rb] = ra; // @link
  if (rank[ra] == rank[rb]) rank[ra]++;
  return ra;
} // @done`,
    connected: `int find(std::vector<int>& parent, int x) {
  int root = x;
  while (parent[root] != root) { // @visit
    root = parent[root];
  }
  int node = x; // @root
  while (parent[node] != root) {
    int next = parent[node];
    parent[node] = root; // @compress
    node = next;
  }
  return root;
}

bool connected(std::vector<int>& parent, int a, int b) { // @start
  return find(parent, a) == find(parent, b); // @answer
} // @done`,
  },
  Python: {
    create: `def find(parent, x):
    root = x
    while parent[root] != root: # @visit
        root = parent[root]
    node = x # @root
    while parent[node] != root:
        nxt = parent[node]
        parent[node] = root # @compress
        node = nxt
    return root

def unite(parent, rank, a, b):
    ra, rb = find(parent, a), find(parent, b)
    if ra == rb: # @compare
        return ra
    if rank[ra] < rank[rb]:
        ra, rb = rb, ra
    parent[rb] = ra # @link
    if rank[ra] == rank[rb]:
        rank[ra] += 1
    return ra

def build_group(group, parent, rank, left, right):
    if right - left == 1:
        return group[left]
    mid = (left + right) // 2
    a = build_group(group, parent, rank, left, mid)
    b = build_group(group, parent, rank, mid, right)
    return unite(parent, rank, a, b)

def build(groups): # @start
    values = [v for group in groups for v in group]
    parent = list(range(len(values)))
    rank = [0] * len(values) # @init
    for group in groups:
        build_group(group, parent, rank, 0, len(group))
    return parent, rank # @done`,
    find: `def find(parent, x): # @start
    root = x
    while parent[root] != root: # @visit
        root = parent[root]
    node = x # @root
    while parent[node] != root:
        nxt = parent[node]
        parent[node] = root # @compress
        node = nxt
    return root # @done`,
    union: `def find(parent, x):
    root = x
    while parent[root] != root: # @visit
        root = parent[root]
    node = x # @root
    while parent[node] != root:
        nxt = parent[node]
        parent[node] = root # @compress
        node = nxt
    return root

def unite(parent, rank, a, b): # @start
    ra, rb = find(parent, a), find(parent, b)
    if ra == rb: # @compare
        return ra
    if rank[ra] < rank[rb]:
        ra, rb = rb, ra
    parent[rb] = ra # @link
    if rank[ra] == rank[rb]:
        rank[ra] += 1
    return ra # @done`,
    connected: `def find(parent, x):
    root = x
    while parent[root] != root: # @visit
        root = parent[root]
    node = x # @root
    while parent[node] != root:
        nxt = parent[node]
        parent[node] = root # @compress
        node = nxt
    return root

def connected(parent, a, b): # @start
    return find(parent, a) == find(parent, b) # @answer
# @done`,
  },
  Go: {
    create: `func find(parent []int, x int) int {
    root := x
    for parent[root] != root { // @visit
        root = parent[root]
    }
    node := x // @root
    for parent[node] != root {
        next := parent[node]
        parent[node] = root // @compress
        node = next
    }
    return root
}

func unite(parent, rank []int, a, b int) int {
    ra, rb := find(parent, a), find(parent, b)
    if ra == rb { // @compare
        return ra
    }
    if rank[ra] < rank[rb] {
        ra, rb = rb, ra
    }
    parent[rb] = ra // @link
    if rank[ra] == rank[rb] {
        rank[ra]++
    }
    return ra
}

func buildGroup(group, parent, rank []int, left, right int) int {
    if right-left == 1 {
        return group[left]
    }
    mid := (left + right) / 2
    a := buildGroup(group, parent, rank, left, mid)
    b := buildGroup(group, parent, rank, mid, right)
    return unite(parent, rank, a, b)
}

func build(groups [][]int) ([]int, []int) { // @start
    n := 0
    for _, group := range groups {
        n += len(group)
    }
    parent := make([]int, n)
    rank := make([]int, n)
    for i := 0; i < n; i++ {
        parent[i] = i
        rank[i] = 0 // @init
    }
    for _, group := range groups {
        buildGroup(group, parent, rank, 0, len(group))
    }
    return parent, rank // @done
}`,
    find: `func find(parent []int, x int) int { // @start
    root := x
    for parent[root] != root { // @visit
        root = parent[root]
    }
    node := x // @root
    for parent[node] != root {
        next := parent[node]
        parent[node] = root // @compress
        node = next
    }
    return root
} // @done`,
    union: `func find(parent []int, x int) int {
    root := x
    for parent[root] != root { // @visit
        root = parent[root]
    }
    node := x // @root
    for parent[node] != root {
        next := parent[node]
        parent[node] = root // @compress
        node = next
    }
    return root
}

func unite(parent, rank []int, a, b int) int { // @start
    ra, rb := find(parent, a), find(parent, b)
    if ra == rb { // @compare
        return ra
    }
    if rank[ra] < rank[rb] {
        ra, rb = rb, ra
    }
    parent[rb] = ra // @link
    if rank[ra] == rank[rb] {
        rank[ra]++
    }
    return ra
} // @done`,
    connected: `func find(parent []int, x int) int {
    root := x
    for parent[root] != root { // @visit
        root = parent[root]
    }
    node := x // @root
    for parent[node] != root {
        next := parent[node]
        parent[node] = root // @compress
        node = next
    }
    return root
}

func connected(parent []int, a, b int) bool { // @start
    return find(parent, a) == find(parent, b) // @answer
} // @done`,
  },
  Java: {
    create: `static int find(int[] parent, int x) {
    int root = x;
    while (parent[root] != root) { // @visit
        root = parent[root];
    }
    int node = x; // @root
    while (parent[node] != root) {
        int next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    return root;
}

static int unite(int[] parent, int[] rank, int a, int b) {
    int ra = find(parent, a);
    int rb = find(parent, b);
    if (ra == rb) return ra; // @compare
    if (rank[ra] < rank[rb]) {
        int temp = ra;
        ra = rb;
        rb = temp;
    }
    parent[rb] = ra; // @link
    if (rank[ra] == rank[rb]) rank[ra]++;
    return ra;
}

static int buildGroup(int[] group, int left, int right,
                      int[] parent, int[] rank) {
    if (right - left == 1) return group[left];
    int mid = (left + right) / 2;
    int a = buildGroup(group, left, mid, parent, rank);
    int b = buildGroup(group, mid, right, parent, rank);
    return unite(parent, rank, a, b);
}

static void build(int[][] groups, int[] parent, int[] rank) { // @start
    for (int i = 0; i < parent.length; i++) {
        parent[i] = i;
        rank[i] = 0; // @init
    }
    for (int[] group : groups)
        buildGroup(group, 0, group.length, parent, rank);
} // @done`,
    find: `static int find(int[] parent, int x) { // @start
    int root = x;
    while (parent[root] != root) { // @visit
        root = parent[root];
    }
    int node = x; // @root
    while (parent[node] != root) {
        int next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    return root;
} // @done`,
    union: `static int find(int[] parent, int x) {
    int root = x;
    while (parent[root] != root) { // @visit
        root = parent[root];
    }
    int node = x; // @root
    while (parent[node] != root) {
        int next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    return root;
}

static int unite(int[] parent, int[] rank, int a, int b) { // @start
    int ra = find(parent, a);
    int rb = find(parent, b);
    if (ra == rb) return ra; // @compare
    if (rank[ra] < rank[rb]) {
        int temp = ra;
        ra = rb;
        rb = temp;
    }
    parent[rb] = ra; // @link
    if (rank[ra] == rank[rb]) rank[ra]++;
    return ra;
} // @done`,
    connected: `static int find(int[] parent, int x) {
    int root = x;
    while (parent[root] != root) { // @visit
        root = parent[root];
    }
    int node = x; // @root
    while (parent[node] != root) {
        int next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    return root;
}

static boolean connected(int[] parent, int a, int b) { // @start
    return find(parent, a) == find(parent, b); // @answer
} // @done`,
  },
  Rust: {
    create: `fn find(parent: &mut Vec<usize>, x: usize) -> usize {
    let mut root = x;
    while parent[root] != root { // @visit
        root = parent[root];
    }
    let mut node = x; // @root
    while parent[node] != root {
        let next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    root
}

fn unite(parent: &mut Vec<usize>, rank: &mut Vec<usize>,
         a: usize, b: usize) -> usize {
    let mut ra = find(parent, a);
    let mut rb = find(parent, b);
    if ra == rb {
        return ra; // @compare
    }
    if rank[ra] < rank[rb] {
        std::mem::swap(&mut ra, &mut rb);
    }
    parent[rb] = ra; // @link
    if rank[ra] == rank[rb] {
        rank[ra] += 1;
    }
    ra
}

fn build_group(group: &[usize], parent: &mut Vec<usize>,
               rank: &mut Vec<usize>) -> usize {
    if group.len() == 1 {
        return group[0];
    }
    let mid = group.len() / 2;
    let a = build_group(&group[..mid], parent, rank);
    let b = build_group(&group[mid..], parent, rank);
    unite(parent, rank, a, b)
}

fn build(groups: &[Vec<usize>]) -> (Vec<usize>, Vec<usize>) { // @start
    let n: usize = groups.iter().map(|group| group.len()).sum();
    let mut parent: Vec<usize> = (0..n).collect();
    let mut rank = vec![0; n]; // @init
    for group in groups {
        build_group(group, &mut parent, &mut rank);
    }
    (parent, rank) // @done
}`,
    find: `fn find(parent: &mut Vec<usize>, x: usize) -> usize { // @start
    let mut root = x;
    while parent[root] != root { // @visit
        root = parent[root];
    }
    let mut node = x; // @root
    while parent[node] != root {
        let next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    root
} // @done`,
    union: `fn find(parent: &mut Vec<usize>, x: usize) -> usize {
    let mut root = x;
    while parent[root] != root { // @visit
        root = parent[root];
    }
    let mut node = x; // @root
    while parent[node] != root {
        let next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    root
}

fn unite(parent: &mut Vec<usize>, rank: &mut Vec<usize>,
         a: usize, b: usize) -> usize { // @start
    let mut ra = find(parent, a);
    let mut rb = find(parent, b);
    if ra == rb {
        return ra; // @compare
    }
    if rank[ra] < rank[rb] {
        std::mem::swap(&mut ra, &mut rb);
    }
    parent[rb] = ra; // @link
    if rank[ra] == rank[rb] {
        rank[ra] += 1;
    }
    ra
} // @done`,
    connected: `fn find(parent: &mut Vec<usize>, x: usize) -> usize {
    let mut root = x;
    while parent[root] != root { // @visit
        root = parent[root];
    }
    let mut node = x; // @root
    while parent[node] != root {
        let next = parent[node];
        parent[node] = root; // @compress
        node = next;
    }
    root
}

fn connected(parent: &mut Vec<usize>, a: usize, b: usize) -> bool { // @start
    let ra = find(parent, a);
    let rb = find(parent, b);
    ra == rb // @answer
} // @done`,
  },
};
