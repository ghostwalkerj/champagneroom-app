## Making a Call
```plantuml
@startuml
Talent -> App : Creates Link : (name, amount, time, note)

Talent <- App : Return Link : Encoded 1 Time Use

Talent -> Subscriber : Share Link : Via Facebook, Telegram, Whatsapp etc

Subscriber -> App : Clicks Link

Subscriber <- App : Requests Payment 

Subscriber -> App : Completes Payment

Subscriber <- App : Initiates Call with Talent

Subscriber <-> Talent : Connects for Call

Talent -> App : Ends Call

Subscriber <- App : Requests Feedback

Talent <- App : Sends Payment
@enduml

