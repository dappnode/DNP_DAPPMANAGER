import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, Address } from "@graphprotocol/graph-ts"
import { NewRepo, NewAppProxy } from "../generated/Registry/Registry"

export function createNewRepoEvent(
  id: Bytes,
  name: string,
  repo: Address
): NewRepo {
  let newRepoEvent = changetype<NewRepo>(newMockEvent())

  newRepoEvent.parameters = new Array()

  newRepoEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromFixedBytes(id))
  )
  newRepoEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  newRepoEvent.parameters.push(
    new ethereum.EventParam("repo", ethereum.Value.fromAddress(repo))
  )

  return newRepoEvent
}

export function createNewAppProxyEvent(proxy: Address): NewAppProxy {
  let newAppProxyEvent = changetype<NewAppProxy>(newMockEvent())

  newAppProxyEvent.parameters = new Array()

  newAppProxyEvent.parameters.push(
    new ethereum.EventParam("proxy", ethereum.Value.fromAddress(proxy))
  )

  return newAppProxyEvent
}
