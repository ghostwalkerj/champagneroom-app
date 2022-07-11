## pCall Transaction
```plantuml
@startuml
autonumber
skinparam participant {
  backgroundColor<<app>> Fuchsia
  backgroundColor<<contract>> DeepSkyBlue
}

actor User #Orchid
actor Caller #Cyan
participant pCall <<app>>
box "Ethereum" #LightCyan
participant "pCall Escrow" as Escrow<<contract>>
participant "ERC20\n(USDC)" as ERC20<<contract>>
end box
actor "pCall Wallet" as Margin #Purple

User -> pCall : ✅ Create Link \n(name, amount, note)
User <- pCall : ✅ Return Link \n(encoded 1 time use)
User -> Caller : ✅ Share Link \n(via Facebook, WhatspApp etc)
Caller -> pCall : ✅ Click Link
Caller <- pCall : 🔴 Request Transfer
Caller -> ERC20 : 🔴 Approve Spend
Escrow -> ERC20 : 🔴 Transfer Payment
Escrow <- ERC20 : 🔴 Payment Released
ERC20 -> Margin: 🔴 Transfer Payment
Escrow -> pCall : 🔴 Confirms Payment
Caller <- pCall : 🟡 Initiate Call
Caller <-> User : 🟡 Connect Call
Caller -> pCall : 🟡 End Call
Caller <- pCall : 🔴 Request Feedback
Caller --> pCall : 🔴 Provide Feedback(?)
pCall -> User : 🔴 Alert Transaction Status
pCall -> Escrow : 🔴 Release Payment
Escrow -> ERC20 : 🔴 Approve Spend
User <- ERC20 : 🔴 Transfer Payment
@enduml
