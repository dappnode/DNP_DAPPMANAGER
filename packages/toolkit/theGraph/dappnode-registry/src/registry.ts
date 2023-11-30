import {
  NewRepo as NewRepoEvent,
  NewAppProxy as NewAppProxyEvent
} from "../generated/Registry/Registry"
import { NewRepo, NewAppProxy } from "../generated/schema"

export function handleNewRepo(event: NewRepoEvent): void {
  let entity = new NewRepo(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.Registry_id = event.params.id
  entity.name = event.params.name
  entity.repo = event.params.repo

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewAppProxy(event: NewAppProxyEvent): void {
  let entity = new NewAppProxy(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.proxy = event.params.proxy

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
