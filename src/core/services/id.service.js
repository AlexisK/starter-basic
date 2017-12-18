export class IdService {

  static getId() {
    return ++IdService.lastId;
  }

  getId() {
    return IdService.getId();
  }
}
IdService.lastId = 0;

export const idService = new IdService();
