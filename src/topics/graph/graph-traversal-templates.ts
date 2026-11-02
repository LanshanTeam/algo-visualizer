import type { Language } from "../../core/types";

export const templates: Record<Language, Record<"bfs" | "dfs", string>> = {
  C: {
    bfs: `void bfs(int start) { // @start
  queue<int> q; visited[start] = true; q.push(start); // @enqueue
  while (!q.empty()) { // @dequeue
    int u = q.front(); q.pop(); // @visit
    for (int v : graph[u]) { // @scan
      if (!visited[v]) { visited[v] = true; q.push(v); } // @discover
    }
  }
} // @done`,
    dfs: `void dfs(int u) { // @start
  visited[u] = true; // @visit
  for (int v : graph[u]) { // @scan
    if (!visited[v]) dfs(v); // @recurse
  }
} // @done`,
  },
  Python: {
    bfs: `def bfs(start): # @start
    queue = deque([start]); visited.add(start) # @enqueue
    while queue: # @dequeue
        u = queue.popleft() # @visit
        for v in graph[u]: # @scan
            if v not in visited: visited.add(v); queue.append(v) # @discover
# @done`,
    dfs: `def dfs(u): # @start
    visited.add(u) # @visit
    for v in graph[u]: # @scan
        if v not in visited: dfs(v) # @recurse
# @done`,
  },
  "C++": {
    bfs: `void bfs(int start) { // @start
  queue<int> q; visited[start] = true; q.push(start); // @enqueue
  while (!q.empty()) { // @dequeue
    int u = q.front(); q.pop(); // @visit
    for (int v : graph[u]) { // @scan
      if (!visited[v]) { visited[v] = true; q.push(v); } // @discover
    }
  }
} // @done`,
    dfs: `void dfs(int u) { // @start
  visited[u] = true; // @visit
  for (int v : graph[u]) { // @scan
    if (!visited[v]) dfs(v); // @recurse
  }
} // @done`,
  },
  Go: {
    bfs: `func bfs(start int) { // @start
    queue := []int{start}; visited[start] = true // @enqueue
    for len(queue) > 0 { // @dequeue
        u := queue[0]; queue = queue[1:] // @visit
        for _, v := range graph[u] { // @scan
            if !visited[v] { visited[v] = true; queue = append(queue, v) } // @discover
        }
    }
} // @done`,
    dfs: `func dfs(u int) { // @start
    visited[u] = true // @visit
    for _, v := range graph[u] { // @scan
        if !visited[v] { dfs(v) } // @recurse
    }
} // @done`,
  },
  Java: {
    bfs: `void bfs(int start) { // @start
  Queue<Integer> q = new ArrayDeque<>(); visited[start] = true; q.add(start); // @enqueue
  while (!q.isEmpty()) { // @dequeue
    int u = q.remove(); // @visit
    for (int v : graph[u]) { // @scan
      if (!visited[v]) { visited[v] = true; q.add(v); } // @discover
    }
  }
} // @done`,
    dfs: `void dfs(int u) { // @start
  visited[u] = true; // @visit
  for (int v : graph[u]) { // @scan
    if (!visited[v]) dfs(v); // @recurse
  }
} // @done`,
  },
  Rust: {
    bfs: `fn bfs(start: usize) { // @start
    let mut queue = VecDeque::from([start]); visited[start] = true; // @enqueue
    while let Some(u) = queue.pop_front() { // @dequeue
        // @visit
        for &v in &graph[u] { // @scan
            if !visited[v] { visited[v] = true; queue.push_back(v); } // @discover
        }
    }
} // @done`,
    dfs: `fn dfs(u: usize) { // @start
    visited[u] = true; // @visit
    for &v in &graph[u] { // @scan
        if !visited[v] { dfs(v); } // @recurse
    }
} // @done`,
  },
};
