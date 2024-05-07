n = int(input().strip())

def check_win(board, player, last_move):
    directions = [(1, 0), (0, 1), (1, 1), (1, -1)]
    for dx, dy in directions:
        count = 1
        for i in range(1, 5):
            if (last_move[0] + dx * i, last_move[1] + dy * i) in board[player]:
                count += 1
            else:
                break
        for i in range(1, 5):
            if (last_move[0] - dx * i, last_move[1] - dy * i) in board[player]:
                count += 1
            else:
                break
        if count >= 5:
            return True
    return False

board = {1: set(), 2: set()}
winner = None

for i in range(n):
    x, y = map(int, input().split())
    player = 1 if i % 2 == 0 else 2
    board[player].add((x, y))
    
    if check_win(board, player, (x, y)):
        winner = "First" if player == 1 else "Second"
        break

if winner:
    if i + 1 < n:
        print("Inattention")
    else:
        print(winner)
else:
    print("Draw")
