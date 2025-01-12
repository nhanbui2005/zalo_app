SELECT * FROM "user";
SELECT * FROM "chatroom";
SELECT * FROM "member";
SELECT * FROM "relation";
SELECT * FROM "message";
SELECT * FROM "auth_provider";

DELETE FROM "user"
WHERE email='vnetc89@gmail.com';

-- Tìm room bằng user_id
SELECT m.room_id
FROM "member" m
LEFT JOIN chatroom r ON m.room_id = r.id
WHERE (
	m.user_id 
	IN (
		'218ec1ce-9357-4d4d-b2d3-894f1e82f8aa',
		'c502261d-13d3-4f1c-ba10-065b31dc152d'
	) AND r.type = 'personal'
)
GROUP BY m.room_id
HAVING COUNT(DISTINCT m.user_id) = 2
;

