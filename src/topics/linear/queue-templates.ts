import type { Language } from "../../core/types";

export const templates: Record<Language, Record<string, string>> = {
  C: {
    enqueue: `int enqueue(Queue *q, int value) { // @start
  if (q->rear + 1 >= CAP) return 0; // @check
  q->data[++q->rear] = value; // @write
  return 1; // @done
}`,
    dequeue: `int dequeue(Queue *q, int *out) { // @start
  if (q->front > q->rear) return 0; // @check
  *out = q->data[q->front]; // @front
  q->front++; // @dequeue
  return 1; // @done
}`,
    peek: `int head(const Queue *q, int *out) { // @start
  if (q->front > q->rear) return 0; // @check
  *out = q->data[q->front]; // @front
  return 1; // @done
}`,
  },
  "C++": {
    enqueue: `bool enqueue(int *data, int &rear, int value) { // @start
  if (rear + 1 >= CAP) return false; // @check
  data[++rear] = value; // @write
  return true; // @done
}`,
    dequeue: `bool dequeue(int *data, int &front, int rear, int &out) { // @start
  if (front > rear) return false; // @check
  out = data[front]; // @front
  ++front; // @dequeue
  return true; // @done
}`,
    peek: `bool head(const int *data, int front, int rear, int &out) { // @start
  if (front > rear) return false; // @check
  out = data[front]; // @front
  return true; // @done
}`,
  },
  Python: {
    enqueue: `def enqueue(data, front, rear, value): # @start
    if rear + 1 >= CAP: # @check
        return rear
    rear += 1
    data[rear] = value # @write
    return rear # @done`,
    dequeue: `def dequeue(data, front, rear): # @start
    if front > rear: # @check
        return front, None
    out = data[front] # @front
    front += 1 # @dequeue
    return front, out # @done`,
    peek: `def head(data, front, rear): # @start
    if front > rear: # @check
        return None
    return data[front] # @front
# 只读队头，不改变队列 # @done`,
  },
  Go: {
    enqueue: `func enqueue(data []int, rear *int, value int) bool { // @start
	if *rear+1 >= cap(data) { // @check
		return false
	}
	*rear = *rear + 1
	data[*rear] = value // @write
	return true // @done
}`,
    dequeue: `func dequeue(data []int, front *int, rear int) (int, bool) { // @start
	if *front > rear { // @check
		return 0, false
	}
	out := data[*front] // @front
	*front = *front + 1 // @dequeue
	return out, true // @done
}`,
    peek: `func head(data []int, front, rear int) (int, bool) { // @start
	if front > rear { // @check
		return 0, false
	}
	return data[front], true // @front
} // @done`,
  },
  Java: {
    enqueue: `boolean enqueue(int value) { // @start
    if (rear + 1 >= CAP) return false; // @check
    data[++rear] = value; // @write
    return true; // @done
}`,
    dequeue: `Integer dequeue() { // @start
    if (front > rear) return null; // @check
    int out = data[front]; // @front
    front++; // @dequeue
    return out; // @done
}`,
    peek: `Integer head() { // @start
    if (front > rear) return null; // @check
    return data[front]; // @front
} // @done`,
  },
  Rust: {
    enqueue: `fn enqueue(data: &mut [i32], rear: &mut isize, value: i32) -> bool { // @start
    if *rear + 1 >= CAP as isize { // @check
        return false;
    }
    *rear += 1;
    data[*rear as usize] = value; // @write
    true // @done
}`,
    dequeue: `fn dequeue(data: &[i32], front: &mut isize, rear: isize) -> Option<i32> { // @start
    if *front > rear { // @check
        return None;
    }
    let out = data[*front as usize]; // @front
    *front += 1; // @dequeue
    Some(out) // @done
}`,
    peek: `fn head(data: &[i32], front: isize, rear: isize) -> Option<i32> { // @start
    if front > rear { // @check
        return None;
    }
    Some(data[front as usize]) // @front
} // @done`,
  },
};
