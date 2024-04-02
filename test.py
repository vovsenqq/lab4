n = int(input())
arr = list(map(int, input().split()))

# n = 8
# arr = [1, 3, 5, 7, 9, 2, 2, 2]


ans = ''

counter_even = 0
counter_odd = 0

for i in range(n):
    if arr[i] % 2 == 0:
        counter_even += 1
    else:
        counter_odd += 1


if counter_odd % 2 == 0:
    status = 0
    for i in range(n - 1):
        if ((arr[i] % 2 == 0 and arr[i+1] % 2 == 1) or ((arr[i] % 2 == 1 and arr[i+1] % 2 == 0))) and status == 0:
            ans = ans + 'x'
            status = 1
        else:
            ans = ans + '+'
else:
    for i in range(n - 1):
        ans = ans + '+'

print(ans)
