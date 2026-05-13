import anthropic

client = anthropic.Anthropic()
client.api_key = "sk-rlgrnjrurqmqqaijlznygzoodibrlmqekkhegxwqwbtck"
client.base_url = "https://taotoken.net/api/v1"

#taotoken cc -k sk-rlgrnjrurqmqqaijlznygzoodibrlmqekkhegxwqwbtck -u https://taotoken.net/api -m deepseek-v4-pro

message = client.messages.create(
    model="deepseek-v4-pro",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [    
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)
print(message.content)