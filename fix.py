with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'className="flex-1 overflow-y-auto px-6 pb-6"',
    'className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6"'
)
with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
